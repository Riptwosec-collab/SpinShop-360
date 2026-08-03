import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { validateCoupon as validateCouponMock } from "@/lib/services/coupons";

const bodySchema = z.object({
  code: z.string().trim().min(1).max(50),
  subtotal: z.number().nonnegative(),
});

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`coupon:${ip}`, RATE_LIMITS.coupon.limit, RATE_LIMITS.coupon.windowMs);

  if (!limit.success) {
    return NextResponse.json(
      { ok: false, message: "ตรวจสอบคูปองบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    const result = await validateCouponMock(parsed.data.code, parsed.data.subtotal);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  const normalizedCode = parsed.data.code.toUpperCase();
  const { data: coupon, error } = await serviceClient
    .from("coupons")
    .select("id, code, name, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, usage_limit_per_user, starts_at, expires_at, is_active")
    .eq("code", normalizedCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return NextResponse.json({ ok: false, message: "ไม่พบคูปองนี้ หรือคูปองหมดอายุแล้ว" }, { status: 404 });
  }

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return NextResponse.json({ ok: false, message: "คูปองยังไม่เริ่มใช้งาน" }, { status: 400 });
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return NextResponse.json({ ok: false, message: "คูปองหมดอายุแล้ว" }, { status: 400 });
  }
  if (parsed.data.subtotal < Number(coupon.minimum_order_amount)) {
    return NextResponse.json(
      { ok: false, message: `ยอดสั่งซื้อขั้นต่ำ ${Number(coupon.minimum_order_amount).toLocaleString("th-TH")} บาท สำหรับคูปองนี้` },
      { status: 400 }
    );
  }

  if (coupon.usage_limit != null) {
    const { count } = await serviceClient
      .from("coupon_usages")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id);
    if ((count ?? 0) >= coupon.usage_limit) {
      return NextResponse.json({ ok: false, message: "คูปองถูกใช้ครบจำนวนแล้ว" }, { status: 400 });
    }
  }

  if (coupon.usage_limit_per_user != null) {
    const authClient = await createSupabaseServerClient();
    const userId = authClient ? (await authClient.auth.getUser()).data.user?.id : null;
    if (userId) {
      const { count } = await serviceClient
        .from("coupon_usages")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("user_id", userId);
      if ((count ?? 0) >= coupon.usage_limit_per_user) {
        return NextResponse.json({ ok: false, message: "คุณใช้คูปองนี้ครบจำนวนแล้ว" }, { status: 400 });
      }
    }
  }

  let discount = 0;
  let freeShipping = false;
  if (coupon.discount_type === "percentage") {
    discount = Math.round(parsed.data.subtotal * (Number(coupon.discount_value) / 100));
  } else if (coupon.discount_type === "fixed") {
    discount = Number(coupon.discount_value);
  } else if (coupon.discount_type === "free_shipping") {
    freeShipping = true;
  }

  if (coupon.maximum_discount_amount != null) {
    discount = Math.min(discount, Number(coupon.maximum_discount_amount));
  }
  discount = Math.min(discount, parsed.data.subtotal);

  return NextResponse.json(
    {
      ok: true,
      message: "ใช้คูปองสำเร็จ",
      discount,
      freeShipping,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Limit": String(limit.limit),
        "X-RateLimit-Remaining": String(limit.remaining),
      },
    }
  );
}
