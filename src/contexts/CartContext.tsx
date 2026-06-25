import type { ReactNode } from 'react';
import type { Listing } from '@/lib/constants';
import { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';

export interface CartItem {
  listing: Listing;
  quantity: number;
}

interface CartContext_ {
  addItem: (listing: Listing, priceOverride?: number) => void;
  clearCart: () => void;
  items: CartItem[];
  removeItem: (listingId: string) => void;
  totalItems: number;
  totalPrice: number;
  updateQuantity: (listingId: string, quantity: number) => void;
}

const CartContext = createContext<CartContext_>({
  addItem: () => {},
  clearCart: () => {},
  items: [],
  removeItem: () => {},
  totalItems: 0,
  totalPrice: 0,
  updateQuantity: () => {},
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  const addItem = (listing: Listing, priceOverride?: number) => {
    if (
      listing.status === 'reserved'
      && listing.reserved_for
      && listing.reserved_for !== user?.id
    ) {
      toast.error('This item is currently reserved for another buyer.');
      return;
    }
    const effectivePrice
      = typeof priceOverride === 'number' && priceOverride > 0
        ? priceOverride
        : listing.price;
    const finalListing: Listing
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
            item_category: (listing as any).category,
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

  const clearCart = () => setItems([]);

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
