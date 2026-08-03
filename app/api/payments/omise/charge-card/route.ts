import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  token: z.string().startsWith("tokn_", "Token ไม่ถูกต้อง"),
  orderId: z.string().uuid(),
  orderNumber: z.string().min(1),
  customerEmail: z.string().email(),
});

const OMISE_API_BASE = "https://api.omise.co";

export async function POST(request: NextRequest) {
  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, message: "ยังไม่ได้ตั้งค่า Omise บนเซิร์ฟเวอร์" }, { status: 501 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, message: "ระบบฐานข้อมูลยังไม่ได้ตั้งค่า" }, { status: 501 });
  }

  const { data: order, error } = await serviceClient
    .from("orders")
    .select("id, order_number, email, grand_total, payment_status, status")
    .eq("id", parsed.data.orderId)
    .eq("order_number", parsed.data.orderNumber)
    .maybeSingle();

  if (error || !order) return NextResponse.json({ ok: false, message: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  if (order.email.toLowerCase() !== parsed.data.customerEmail.toLowerCase()) {
    return NextResponse.json({ ok: false, message: "ข้อมูลเจ้าของคำสั่งซื้อไม่ถูกต้อง" }, { status: 403 });
  }
  if (order.payment_status === "paid" || ["cancelled", "refunded"].includes(order.status)) {
    return NextResponse.json({ ok: false, message: "คำสั่งซื้อนี้ไม่สามารถชำระเงินได้" }, { status: 409 });
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  try {
    const chargeRes = await fetch(`${OMISE_API_BASE}/charges`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        amount: String(Math.round(Number(order.grand_total) * 100)),
        currency: "thb",
        card: parsed.data.token,
        metadata: JSON.stringify({ orderId: order.id, orderNumber: order.order_number }),
      }),
    });

    const charge = await chargeRes.json();
    if (!chargeRes.ok) {
      return NextResponse.json({ ok: false, message: charge?.message ?? "การชำระเงินไม่สำเร็จ" }, { status: 402 });
    }
    if (charge.status === "failed") {
      return NextResponse.json({ ok: false, message: "บัตรถูกปฏิเสธ กรุณาลองบัตรอื่น" }, { status: 402 });
    }

    return NextResponse.json({
      ok: true,
      message: charge.status === "successful" ? "ชำระเงินสำเร็จ" : "กำลังตรวจสอบการชำระเงิน",
      providerTransactionId: charge.id,
      status: charge.status,
      authorizeUri: charge.authorize_uri ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Omise" },
      { status: 500 }
    );
  }
}
