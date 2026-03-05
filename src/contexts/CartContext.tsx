import { createContext, useContext, useState, type ReactNode } from "react";
import type { Listing } from "@/lib/constants";

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

  const addItem = (listing: Listing) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.listing.id === listing.id);
      if (existing) return prev; // no duplicates for unique items
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
