export interface MockCoupon {
  code: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  discountValue: number;
  minimumOrderAmount: number;
  isActive: boolean;
}

const MOCK_COUPONS: MockCoupon[] = [
  { code: "SPIN10", discountType: "percentage", discountValue: 10, minimumOrderAmount: 500, isActive: true },
  { code: "SAVE100", discountType: "fixed", discountValue: 100, minimumOrderAmount: 1000, isActive: true },
  { code: "FREESHIP", discountType: "free_shipping", discountValue: 0, minimumOrderAmount: 0, isActive: true },
];

/**
 * Server-side coupon validation. In Supabase mode, replace this with a
 * query against `coupons` + `coupon_usages`, checking usage_limit,
 * usage_limit_per_user, starts_at/expires_at, and category/product scope.
 */
export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ ok: boolean; message: string; discount?: number; coupon?: MockCoupon }> {
  await new Promise((r) => setTimeout(r, 300));
  const coupon = MOCK_COUPONS.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());

  if (!coupon || !coupon.isActive) {
    return { ok: false, message: "ไม่พบคูปองนี้ หรือคูปองหมดอายุแล้ว" };
  }
  if (subtotal < coupon.minimumOrderAmount) {
    return {
      ok: false,
      message: `ยอดสั่งซื้อขั้นต่ำ ${coupon.minimumOrderAmount.toLocaleString()} บาท สำหรับคูปองนี้`,
    };
  }

  let discount = 0;
  if (coupon.discountType === "percentage") discount = Math.round(subtotal * (coupon.discountValue / 100));
  if (coupon.discountType === "fixed") discount = coupon.discountValue;
  if (coupon.discountType === "free_shipping") discount = 0; // shipping handled separately

  return { ok: true, message: "ใช้คูปองสำเร็จ", discount, coupon };
}
