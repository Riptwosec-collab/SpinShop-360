import { describe, it, expect } from "vitest";
import { createOrder } from "@/lib/services/orders";
import type { CartItem } from "@/types/cart";

const shippingAddress = {
  recipientName: "ทดสอบ ระบบ",
  phone: "0812345678",
  addressLine1: "123 ถนนทดสอบ",
  subdistrict: "แขวงทดสอบ",
  district: "เขตทดสอบ",
  province: "กรุงเทพมหานคร",
  postalCode: "10110",
};

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "item-1",
    productId: "p1", // Vertex Pro Gaming Mouse in mock data
    variantId: "v1",
    productName: "Vertex Pro Gaming Mouse",
    variantLabel: "ดำ",
    slug: "vertex-pro-gaming-mouse",
    imageUrl: "https://example.com/img.jpg",
    unitPrice: 1990,
    compareAtPrice: 2490,
    quantity: 1,
    stockQuantity: 30,
    ...overrides,
  };
}

describe("createOrder (mock service)", () => {
  it("สร้างคำสั่งซื้อสำเร็จและคำนวณยอดรวมถูกต้อง", async () => {
    const result = await createOrder({
      email: "test@example.com",
      phone: "0812345678",
      items: [makeItem({ quantity: 2, unitPrice: 1990 })],
      shippingAddress,
      paymentMethod: "promptpay",
      shippingMethod: "standard",
      discount: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.order?.subtotal).toBe(3980);
    expect(result.order?.grandTotal).toBeGreaterThanOrEqual(3980); // subtotal + shipping (or free)
  });

  it("หักส่วนลดออกจากยอดชำระสุดท้ายถูกต้อง และแก้ไขราคาตามราคาจริงในระบบ (ไม่เชื่อราคาจาก Client)", async () => {
    const result = await createOrder({
      email: "test@example.com",
      phone: "0812345678",
      items: [makeItem({ quantity: 1, unitPrice: 2000 })], // client sends a stale/tampered price
      shippingAddress,
      paymentMethod: "bank_transfer",
      shippingMethod: "standard",
      discount: 200,
    });

    // Server re-verifies against the real variant price (1990), not the
    // client's cached 2000 — this is the overselling/price-tamper guard.
    expect(result.order?.subtotal).toBe(1990);
    // subtotal 1990 >= free shipping threshold (1500) -> shipping 0
    expect(result.order?.grandTotal).toBe(1790);
  });

  it("ปฏิเสธคำสั่งซื้อเมื่อสินค้าที่ระบุไม่มีอยู่จริงในระบบ", async () => {
    const result = await createOrder({
      email: "test@example.com",
      phone: "0812345678",
      items: [makeItem({ productId: "does-not-exist", variantId: "does-not-exist" })],
      shippingAddress,
      paymentMethod: "cod",
      shippingMethod: "standard",
    });

    expect(result.ok).toBe(false);
  });

  it("ปฏิเสธคำสั่งซื้อเมื่อจำนวนที่สั่งเกินสต็อกจริงในระบบ", async () => {
    const result = await createOrder({
      email: "test@example.com",
      phone: "0812345678",
      items: [makeItem({ quantity: 999999 })],
      shippingAddress,
      paymentMethod: "cod",
      shippingMethod: "standard",
    });

    expect(result.ok).toBe(false);
  });

  it("คำสั่งซื้อแบบเก็บเงินปลายทางมีสถานะเริ่มต้นเป็น processing", async () => {
    const result = await createOrder({
      email: "test@example.com",
      phone: "0812345678",
      items: [makeItem()],
      shippingAddress,
      paymentMethod: "cod",
      shippingMethod: "standard",
    });

    expect(result.order?.status).toBe("processing");
  });
});
