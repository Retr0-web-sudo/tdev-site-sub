import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface WishlistContextType {
  items: Tables<"products">[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Tables<"products">) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "tdev-wishlist";

const loadWishlist = (): Tables<"products">[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Tables<"products">[]>(loadWishlist);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isInWishlist = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items]
  );

  const toggleWishlist = useCallback(
    (product: Tables<"products">) => {
      setItems((prev) => {
        const exists = prev.some((i) => i.id === product.id);
        if (exists) {
          toast("Removed from wishlist", { description: product.name });
          return prev.filter((i) => i.id !== product.id);
        }
        toast("Added to wishlist", { description: product.name });
        return [...prev, product];
      });
    },
    []
  );

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const clearWishlist = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider
      value={{ items, isInWishlist, toggleWishlist, removeFromWishlist, clearWishlist, totalItems: items.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

const defaultWishlist: WishlistContextType = {
  items: [],
  isInWishlist: () => false,
  toggleWishlist: () => {},
  removeFromWishlist: () => {},
  clearWishlist: () => {},
  totalItems: 0,
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  return ctx ?? defaultWishlist;
};
