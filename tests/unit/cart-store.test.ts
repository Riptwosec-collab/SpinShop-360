import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/lib/stores/cart-store";

const sampleItem = {
  productId: "p1",
  variantId: "v1",
  productName: "Test Product",
  variantLabel: "ดำ",
  slug: "test-product",
  imageUrl: "https://example.com/img.jpg",
  unitPrice: 1000,
  compareAtPrice: 1200,
  quantity: 1,
  stockQuantity: 5,
};

describe("cart-store", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("เพิ่มสินค้าลงตะกร้าได้", () => {
    const result = useCartStore.getState().addItem(sampleItem);
    expect(result.ok).toBe(true);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().itemCount()).toBe(1);
  });

  it("เพิ่มสินค้าเดิมซ้ำจะรวมจำนวนแทนการสร้างรายการใหม่", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().addItem({ ...sampleItem, quantity: 2 });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("ป้องกันการเพิ่มจำนวนเกินสต็อกที่มี", () => {
    const result = useCartStore.getState().addItem({ ...sampleItem, quantity: 10 });
    expect(result.ok).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("ป้องกันการเพิ่มจำนวนสะสมเกินสต็อกเมื่อเพิ่มซ้ำหลายครั้ง", () => {
    useCartStore.getState().addItem({ ...sampleItem, quantity: 4 });
    const second = useCartStore.getState().addItem({ ...sampleItem, quantity: 3 });

    expect(second.ok).toBe(false);
    // First add should remain unchanged at quantity 4.
    expect(useCartStore.getState().items[0].quantity).toBe(4);
  });

  it("อัปเดตจำนวนสินค้าได้และไม่เกิน stockQuantity", () => {
    useCartStore.getState().addItem(sampleItem);
    const id = useCartStore.getState().items[0].id;

    useCartStore.getState().updateQuantity(id, 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    useCartStore.getState().updateQuantity(id, 999);
    expect(useCartStore.getState().items[0].quantity).toBe(5); // clamped to stockQuantity
  });

  it("อัปเดตจำนวนขั้นต่ำคือ 1 (ห้ามต่ำกว่า)", () => {
    useCartStore.getState().addItem(sampleItem);
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("ลบสินค้าออกจากตะกร้าได้", () => {
    useCartStore.getState().addItem(sampleItem);
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("คำนวณ subtotal ถูกต้องจากจำนวนและราคาต่อชิ้น", () => {
    useCartStore.getState().addItem({ ...sampleItem, quantity: 2, unitPrice: 500 });
    expect(useCartStore.getState().subtotal()).toBe(1000);
  });

  it("ให้ส่งฟรีเมื่อยอดถึงเกณฑ์ขั้นต่ำ และคิดค่าส่งเมื่อไม่ถึง", () => {
    useCartStore.getState().addItem({ ...sampleItem, quantity: 1, unitPrice: 100 });
    expect(useCartStore.getState().shippingFee()).toBeGreaterThan(0);

    useCartStore.getState().clearCart();
    useCartStore.getState().addItem({ ...sampleItem, quantity: 1, unitPrice: 2000 });
    expect(useCartStore.getState().shippingFee()).toBe(0);
  });

  it("รวมส่วนลดคูปองในยอดรวมสุดท้าย", () => {
    useCartStore.getState().addItem({ ...sampleItem, quantity: 1, unitPrice: 2000 });
    useCartStore.getState().applyCoupon("SPIN10", 200);
    expect(useCartStore.getState().total()).toBe(1800); // 2000 - 200 + free shipping
  });
});
