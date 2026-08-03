import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompareState {
  productIds: string[];
  toggle: (productId: string) => { ok: boolean; message: string };
  remove: (productId: string) => void;
  clear: () => void;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const exists = get().productIds.includes(productId);
        if (exists) {
          set({ productIds: get().productIds.filter((id) => id !== productId) });
          return { ok: true, message: "นำออกจากการเปรียบเทียบแล้ว" };
        }
        if (get().productIds.length >= MAX_COMPARE) {
          return { ok: false, message: `เปรียบเทียบได้สูงสุด ${MAX_COMPARE} รายการ` };
        }
        set({ productIds: [...get().productIds, productId] });
        return { ok: true, message: "เพิ่มในรายการเปรียบเทียบแล้ว" };
      },
      remove: (productId) =>
        set({ productIds: get().productIds.filter((id) => id !== productId) }),
      clear: () => set({ productIds: [] }),
    }),
    { name: "spinshop360-compare" }
  )
);
