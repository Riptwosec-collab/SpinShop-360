import { describe, it, expect } from "vitest";
import { findVariant } from "@/lib/services/products";
import { MOCK_PRODUCTS } from "@/lib/mock-data/products";

describe("findVariant", () => {
  it("หาสินค้า variant เดียว (ไม่มี option) ได้ถูกต้อง", () => {
    const product = MOCK_PRODUCTS.find((p) => p.slug === "lumen-adjustable-desk-lamp")!;
    const variant = findVariant(product, []);
    expect(variant).not.toBeNull();
    expect(variant?.id).toBe(product.variants[0].id);
  });

  it("หา variant ที่ตรงกับชุด option ที่เลือกได้ถูกต้อง", () => {
    const product = MOCK_PRODUCTS.find((p) => p.slug === "halo-x13-smartphone")!;
    // 256GB + ไทเทเนียม
    const variant = findVariant(product, ["ov7", "ov9"]);
    expect(variant?.sku).toBe("HLO-X13-256-TI");
  });

  it("คืนค่า null เมื่อไม่มี variant ที่ตรงกับตัวเลือกที่ให้มา", () => {
    const product = MOCK_PRODUCTS.find((p) => p.slug === "halo-x13-smartphone")!;
    const variant = findVariant(product, ["nonexistent-value-id"]);
    expect(variant).toBeNull();
  });

  it("ทุกสินค้าใน seed data มี variant อย่างน้อยหนึ่งรายการ", () => {
    for (const product of MOCK_PRODUCTS) {
      expect(product.variants.length).toBeGreaterThan(0);
    }
  });
});
