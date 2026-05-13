import { createContext, useContext, useState, type ReactNode } from "react";
import type { Listing } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CartItem {
  listing: Listing;
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  addItem: (listing: Listing) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartCtx>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  const addItem = (listing: Listing) => {
    if (listing.status === "reserved" && listing.reserved_for && listing.reserved_for !== user?.id) {
      toast.error("This item is currently reserved for another buyer.");
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.listing.id === listing.id);
      if (existing) return prev; // no duplicates for unique items
      trackEvent("add_to_cart", {
        currency: "ZAR",
        value: listing.price,
        items: [{ item_id: listing.id, item_name: listing.title, item_category: (listing as any).category, price: listing.price, quantity: 1 }],
      });
      return [...prev, { listing, quantity: 1 }];
    });
  };

  const removeItem = (listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listing.id !== listingId));
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    if (quantity < 1) return removeItem(listingId);
    setItems((prev) =>
      prev.map((i) => (i.listing.id === listingId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.listing.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
