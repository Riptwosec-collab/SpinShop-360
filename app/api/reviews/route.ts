import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

const bodySchema = z.object({
  productId: z.string(),
  orderItemId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  content: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "การส่งรีวิวต้องเชื่อมต่อ Supabase ก่อน (ไม่รองรับใน Mock Mode)" },
      { status: 501 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "กรุณาเข้าสู่ระบบก่อนเขียนรีวิว" }, { status: 401 });
  }

  const { success, resetAt } = rateLimit(`review:${user.id}`, RATE_LIMITS.review.limit, RATE_LIMITS.review.windowMs);
  if (!success) {
    return NextResponse.json(
      { ok: false, message: "ส่งรีวิวบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลรีวิวไม่ถูกต้อง" }, { status: 400 });
  }

  const { data: orderItem } = await supabase
    .from("order_items")
    .select("id, order_id, orders!inner(user_id, status)")
    .eq("id", parsed.data.orderItemId)
    .maybeSingle();

  const order = (orderItem as unknown as { orders?: { user_id: string; status: string } })?.orders;
  if (!orderItem || !order || order.user_id !== user.id || !["delivered", "completed"].includes(order.status)) {
    return NextResponse.json(
      { ok: false, message: "คุณสามารถรีวิวได้เฉพาะสินค้าที่ซื้อและได้รับสินค้าแล้วเท่านั้น" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      product_id: parsed.data.productId,
      user_id: user.id,
      order_item_id: parsed.data.orderItemId,
      rating: parsed.data.rating,
      title: parsed.data.title,
      content: parsed.data.content,
      is_verified_purchase: true,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: "ไม่สามารถบันทึกรีวิวได้" }, { status: 500 });
  }

  await writeAuditLog({ userId: user.id, action: "review.submit", entityType: "review", entityId: data.id });
  return NextResponse.json({ ok: true, message: "ส่งรีวิวสำเร็จ รอการตรวจสอบก่อนเผยแพร่", review: data });
}
