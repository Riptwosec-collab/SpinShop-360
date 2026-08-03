import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";
import { FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_FEE } from "@/lib/constants";
import { track } from "@/lib/analytics";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "id">) => { ok: boolean; message: string };
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyCoupon: (code: string, discount: number) => void;
  clearCoupon: () => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
  shippingFee: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,
      isDrawerOpen: false,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      addItem: (newItem) => {
        const items = get().items;
        const existing = items.find((i) => i.variantId === newItem.variantId);

        if (existing) {
          const nextQty = existing.quantity + newItem.quantity;
          if (nextQty > newItem.stockQuantity) {
            return { ok: false, message: "จำนวนสินค้าในตะกร้าเกินสต็อกที่มี" };
          }
          set({
            items: items.map((i) =>
              i.variantId === newItem.variantId ? { ...i, quantity: nextQty } : i
            ),
          });
          track("add_to_cart", { productId: newItem.productId, variantId: newItem.variantId, quantity: newItem.quantity });
          return { ok: true, message: "อัปเดตจำนวนสินค้าในตะกร้าแล้ว" };
        }

        if (newItem.quantity > newItem.stockQuantity) {
          return { ok: false, message: "สินค้าคงเหลือไม่เพียงพอ" };
        }

        set({
          items: [...items, { ...newItem, id: `${newItem.variantId}-${Date.now()}` }],
        });
        track("add_to_cart", { productId: newItem.productId, variantId: newItem.variantId, quantity: newItem.quantity });
        return { ok: true, message: "เพิ่มสินค้าลงตะกร้าแล้ว" };
      },

      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item) track("remove_from_cart", { productId: item.productId, variantId: item.variantId });
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) =>
        set({
          items: get().items.map((i) =>
            i.id === id
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stockQuantity)) }
              : i
          ),
        }),

      applyCoupon: (code, discount) => set({ couponCode: code, discount }),
      clearCoupon: () => set({ couponCode: null, discount: 0 }),
      clearCart: () => set({ items: [], couponCode: null, discount: 0 }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      shippingFee: () => {
        const subtotal = get().subtotal();
        if (subtotal === 0) return 0;
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
      },
      total: () => {
        const subtotal = get().subtotal();
        const shipping = get().shippingFee();
        const discount = get().discount;
        return Math.max(0, subtotal + shipping - discount);
      },
    }),
    { name: "spinshop360-cart" }
  )
);
