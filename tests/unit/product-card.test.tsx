import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ProductCard } from "@/components/product/product-card";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";
import { useCartStore } from "@/lib/stores/cart-store";
import type { Product } from "@/types/product";

beforeEach(() => { localStorage.clear(); useCartStore.getState().clearCart(); });
afterEach(cleanup);
function show(product: Product) { render(<LocaleProvider><ProductCard product={product} /></LocaleProvider>); }

it("adds the purchasable variant instead of a sold-out first variant", () => {
  const base = MOCK_PRODUCTS[0];
  const available = { ...base.variants[0], id: "available", stockQuantity: 3, isActive: true };
  show({ ...base, options: [], variants: [{ ...available, id: "sold-out", stockQuantity: 0 }, available] });
  fireEvent.click(screen.getByRole("button", { name: "เพิ่มลงตะกร้า" }));
  expect(useCartStore.getState().items).toEqual([expect.objectContaining({ variantId: "available", quantity: 1 })]);
});

it("prevents purchase when a catalog entry has no variants", () => {
  show({ ...MOCK_PRODUCTS[0], options: [], variants: [] });
  expect(screen.getByRole("button", { name: "สินค้าหมด" })).toBeDisabled();
  expect(useCartStore.getState().items).toHaveLength(0);
});
