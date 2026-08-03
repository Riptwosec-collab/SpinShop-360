import { describe, it, expect } from "vitest";
import { validateCoupon } from "@/lib/services/coupons";

describe("validateCoupon", () => {
  it("ใช้คูปองเปอร์เซ็นต์ได้ถูกต้องเมื่อยอดถึงขั้นต่ำ", async () => {
    const result = await validateCoupon("SPIN10", 1000);
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(100); // 10% of 1000
  });

  it("ปฏิเสธคูปองเมื่อยอดไม่ถึงขั้นต่ำ", async () => {
    const result = await validateCoupon("SAVE100", 500);
    expect(result.ok).toBe(false);
  });

  it("ใช้คูปองส่วนลดจำนวนเงินคงที่ได้ถูกต้อง", async () => {
    const result = await validateCoupon("SAVE100", 1500);
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(100);
  });

  it("ปฏิเสธรหัสคูปองที่ไม่มีอยู่จริง", async () => {
    const result = await validateCoupon("NOTREAL", 5000);
    expect(result.ok).toBe(false);
  });

  it("ไม่สนใจตัวพิมพ์เล็ก-ใหญ่ของรหัสคูปอง", async () => {
    const result = await validateCoupon("spin10", 1000);
    expect(result.ok).toBe(true);
  });
});
