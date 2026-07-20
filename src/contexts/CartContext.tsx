import type { ReactNode } from 'react';
import type { MarketplaceListing } from '@/queries/marketplace.query';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { fetchMarketplaceListing } from '@/queries/marketplace.query';

export interface CartItem {
  listing: MarketplaceListing;
  quantity: number;
}

interface CartContext_ {
  addItem: (listing: MarketplaceListing, priceOverride?: number) => void;
  clearCart: () => void;
  isHydrated: boolean;
  items: CartItem[];
  removeItem: (listingId: string) => void;
  totalItems: number;
  totalPrice: number;
  updateQuantity: (listingId: string, quantity: number) => void;
}

const CartContext = createContext<CartContext_>({
  addItem: () => {},
  clearCart: () => {},
  isHydrated: false,
  items: [],
  removeItem: () => {},
  totalItems: 0,
  totalPrice: 0,
  updateQuantity: () => {},
});

export const useCart = () => useContext(CartContext);

const GUEST_CART_KEY = 'cart:guest';

function cartStorageKey(userId?: string) {
  return userId ? `cart:${userId}` : GUEST_CART_KEY;
}

function readStoredCart(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw)
      return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }
  catch {
    return [];
  }
}

function writeStoredCart(key: string, items: CartItem[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  }
  catch {
    // storage unavailable — cart stays in memory only
  }
}

function mergeCarts(base: CartItem[], extra: CartItem[]): CartItem[] {
  const seen = new Set(base.map(item => item.listing.id));
  return [...base, ...extra.filter(item => !seen.has(item.listing.id))];
}

// A listing is buyable right now only if it is APPROVED, or RESERVED for the
// current user. SOLD, PENDING, REJECTED, NEEDS_REVISION and 404 are all pruned.
function isBuyable(listing: MarketplaceListing | null): listing is MarketplaceListing {
  if (!listing)
    return false;
  if (listing.status === 'APPROVED')
    return true;
  if (listing.status === 'RESERVED')
    return listing.reservedForCurrentUser === true;
  return false;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;
  const activeKeyReference = useRef(cartStorageKey(userId));

  const validateStoredCart = useCallback(async (current: CartItem[], key: string) => {
    if (current.length === 0)
      return;

    const checked = await Promise.all(
      current.map(async (item) => {
        const fresh = await fetchMarketplaceListing(item.listing.id);
        return { fresh, item };
      }),
    );

    let removedCount = 0;
    let refreshed = false;
    const next: CartItem[] = [];

    for (const { fresh, item } of checked) {
      if (!isBuyable(fresh)) {
        removedCount += 1;
        continue;
      }
      // Preserve a negotiated (reserved-for-me) price; refresh everything else.
      const price = (fresh.reservedForCurrentUser ? item.listing : fresh).price;
      if (price !== item.listing.price || fresh.title !== item.listing.title)
        refreshed = true;
      next.push({ ...item, listing: { ...fresh, price } });
    }

    if (removedCount === 0 && !refreshed)
      return;
    // Bail if the user switched carts while the checks were in flight.
    if (activeKeyReference.current !== key)
      return;

    setItems((live) => {
      const currentIds = new Set(current.map(item => item.listing.id));
      const addedDuringValidation = live.filter(item => !currentIds.has(item.listing.id));
      return [...next, ...addedDuringValidation];
    });

    if (removedCount > 0) {
      toast.info(
        removedCount === 1
          ? '1 item in your cart is no longer available and was removed.'
          : `${removedCount} items in your cart are no longer available and were removed.`,
      );
    }
    else if (refreshed) {
      toast.info('Your cart was updated with the latest prices.');
    }
  }, []);

  // Hydrate from storage whenever the active user identity changes, merging any
  // guest cart into the signed-in user's cart, then validate availability.
  useEffect(() => {
    const activeKey = cartStorageKey(userId);
    activeKeyReference.current = activeKey;

    let loaded = readStoredCart(activeKey);
    if (userId) {
      const guestCart = readStoredCart(GUEST_CART_KEY);
      if (guestCart.length > 0) {
        loaded = mergeCarts(loaded, guestCart);
        writeStoredCart(activeKey, loaded);
        localStorage.removeItem(GUEST_CART_KEY);
      }
    }

    setItems(loaded);
    setIsHydrated(true);
    void validateStoredCart(loaded, activeKey);
  }, [userId, validateStoredCart]);

  // Persist on every change to whichever key we hydrated from.
  useEffect(() => {
    if (!isHydrated)
      return;
    writeStoredCart(activeKeyReference.current, items);
  }, [items, isHydrated]);

  const addItem = (listing: MarketplaceListing, priceOverride?: number) => {
    if (listing.status === 'RESERVED' && !listing.reservedForCurrentUser) {
      toast.error('This item is currently reserved for another buyer.');
      return;
    }
    const effectivePrice
      = typeof priceOverride === 'number' && priceOverride > 0
        ? priceOverride
        : listing.price;
    const finalListing: MarketplaceListing
      = effectivePrice === listing.price
        ? listing
        : { ...listing, price: effectivePrice };
    setItems((previous) => {
      const existing = previous.find(index => index.listing.id === listing.id);
      if (existing)
        return previous; // no duplicates for unique items
      trackEvent('add_to_cart', {
        currency: 'PKR',
        items: [
          {
            item_category: listing.categoryValue,
            item_id: listing.id,
            item_name: listing.title,
            price: effectivePrice,
            quantity: 1,
          },
        ],
        value: effectivePrice,
      });
      return [...previous, { listing: finalListing, quantity: 1 }];
    });
  };

  const removeItem = (listingId: string) => {
    setItems(previous => previous.filter(index => index.listing.id !== listingId));
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    if (quantity < 1)
      return removeItem(listingId);
    setItems(previous =>
      previous.map(index => (index.listing.id === listingId ? { ...index, quantity } : index)),
    );
  };

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, index) => sum + index.quantity, 0);
  const totalPrice = items.reduce(
    (sum, index) => sum + index.listing.price * index.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        addItem,
        clearCart,
        isHydrated,
        items,
        removeItem,
        totalItems,
        totalPrice,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
