import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { Tables } from "@/integrations/supabase/types";

export interface CartItem {
  product: Tables<"products">;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Tables<"products">, size?: string, color?: string) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const itemKey = (productId: string, size?: string, color?: string) =>
  `${productId}-${size ?? ""}-${color ?? ""}`;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (product: Tables<"products">, size?: string, color?: string) => {
      setItems((prev) => {
        const key = itemKey(product.id, size, color);
        const existing = prev.find(
          (i) => itemKey(i.product.id, i.selectedSize, i.selectedColor) === key
        );
        if (existing) {
          return prev.map((i) =>
            itemKey(i.product.id, i.selectedSize, i.selectedColor) === key
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, size?: string, color?: string) => {
      const key = itemKey(productId, size, color);
      setItems((prev) =>
        prev.filter((i) => itemKey(i.product.id, i.selectedSize, i.selectedColor) !== key)
      );
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, size?: string, color?: string) => {
      if (quantity <= 0) {
        removeItem(productId, size, color);
        return;
      }
      const key = itemKey(productId, size, color);
      setItems((prev) =>
        prev.map((i) =>
          itemKey(i.product.id, i.selectedSize, i.selectedColor) === key
            ? { ...i, quantity }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, isOpen, openCart, closeCart, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

const defaultCart: CartContextType = {
  items: [],
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  return ctx ?? defaultCart;
};
