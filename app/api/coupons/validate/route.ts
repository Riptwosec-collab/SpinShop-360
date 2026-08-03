import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateCoupon as validateCouponMock } from "@/lib/services/coupons";

const bodySchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().nonnegative(),
});

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * POST /api/coupons/validate
 * Rate-limited (10 req/min/IP) since coupon codes are guessable and this
 * endpoint would otherwise let someone brute-force valid codes.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const { success, resetAt } = rateLimit(`coupon:${ip}`, RATE_LIMITS.coupon.limit, RATE_LIMITS.coupon.windowMs);

  if (!success) {
    return NextResponse.json(
      { ok: false, message: "ตรวจสอบคูปองบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    // Mock Mode fallback
    const result = await validateCouponMock(parsed.data.code, parsed.data.subtotal);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", parsed.data.code)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return NextResponse.json({ ok: false, message: "ไม่พบคูปองนี้ หรือคูปองหมดอายุแล้ว" }, { status: 404 });
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return NextResponse.json({ ok: false, message: "คูปองยังไม่เริ่มใช้งาน" }, { status: 400 });
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return NextResponse.json({ ok: false, message: "คูปองหมดอายุแล้ว" }, { status: 400 });
  }
  if (parsed.data.subtotal < coupon.minimum_order_amount) {
    return NextResponse.json(
      { ok: false, message: `ยอดสั่งซื้อขั้นต่ำ ${coupon.minimum_order_amount.toLocaleString()} บาท สำหรับคูปองนี้` },
      { status: 400 }
    );
  }

  let discount = 0;
  if (coupon.discount_type === "percentage") discount = Math.round(parsed.data.subtotal * (coupon.discount_value / 100));
  if (coupon.discount_type === "fixed") discount = coupon.discount_value;
  if (coupon.maximum_discount_amount != null) discount = Math.min(discount, coupon.maximum_discount_amount);

  return NextResponse.json({ ok: true, message: "ใช้คูปองสำเร็จ", discount, coupon });
}
