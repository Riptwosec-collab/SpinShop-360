import { create } from "zustand";
import { persist } from "zustand/middleware";
import { track } from "@/lib/analytics";

interface WishlistState {
  productIds: string[];
  toggle: (productId: string) => boolean; // returns true if now in wishlist
  isWishlisted: (productId: string) => boolean;
  remove: (productId: string) => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const exists = get().productIds.includes(productId);
        if (exists) {
          set({ productIds: get().productIds.filter((id) => id !== productId) });
          return false;
        }
        set({ productIds: [...get().productIds, productId] });
        track("wishlist_add", { productId });
        return true;
      },
      isWishlisted: (productId) => get().productIds.includes(productId),
      remove: (productId) =>
        set({ productIds: get().productIds.filter((id) => id !== productId) }),
      count: () => get().productIds.length,
    }),
    { name: "spinshop360-wishlist" }
  )
);
