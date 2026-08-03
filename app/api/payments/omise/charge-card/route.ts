import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyCheckoutToken } from "@/lib/checkout-token";

const bodySchema = z.object({
  token: z.string().startsWith("tokn_", "Token ไม่ถูกต้อง"),
  orderId: z.string().uuid(),
  paymentToken: z.string().min(20),
});

const OMISE_API_BASE = "https://api.omise.co";

/**
 * Exchanges an Omise.js card token for a charge using the amount loaded from
 * the trusted order record. Browser-supplied totals are never accepted.
 */
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

  const checkoutToken = verifyCheckoutToken(parsed.data.paymentToken, parsed.data.orderId);
  if (!checkoutToken) {
    return NextResponse.json({ ok: false, message: "สิทธิ์ชำระเงินหมดอายุหรือไม่ถูกต้อง" }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, message: "ระบบฐานข้อมูลยังไม่ได้ตั้งค่า" }, { status: 501 });
  }

  const { data: order, error } = await serviceClient
    .from("orders")
    .select("id, order_number, email, grand_total, payment_method, payment_status, status")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (error || !order || order.order_number !== checkoutToken.orderNumber) {
    return NextResponse.json({ ok: false, message: "ไม่พบคำสั่งซื้อนี้" }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: false, message: "คำสั่งซื้อนี้ชำระเงินแล้ว" }, { status: 409 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ ok: false, message: "คำสั่งซื้อนี้หมดอายุหรือถูกยกเลิกแล้ว" }, { status: 409 });
  }
  if (order.payment_method !== "credit_card" && order.payment_method !== "debit_card") {
    return NextResponse.json({ ok: false, message: "วิธีชำระเงินไม่ตรงกับคำสั่งซื้อ" }, { status: 400 });
  }

  const { data: activeReservation } = await serviceClient
    .from("stock_reservations")
    .select("id")
    .eq("order_id", order.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (!activeReservation) {
    return NextResponse.json({ ok: false, message: "การจองสินค้าหมดอายุแล้ว กรุณาสั่งซื้อใหม่" }, { status: 409 });
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
    if (!chargeRes.ok || charge.status === "failed") {
      await serviceClient.from("payments").insert({
        order_id: order.id,
        provider: "omise",
        provider_transaction_id: charge?.id ?? null,
        method: order.payment_method,
        amount: Number(order.grand_total),
        currency: "THB",
        status: "failed",
        payment_data: { failure_code: charge?.failure_code ?? null },
      });
      return NextResponse.json(
        { ok: false, message: charge?.message ?? "บัตรถูกปฏิเสธ กรุณาลองบัตรอื่น" },
        { status: 402 }
      );
    }

    await serviceClient.from("payments").insert({
      order_id: order.id,
      provider: "omise",
      provider_transaction_id: charge.id,
      method: order.payment_method,
      amount: Number(order.grand_total),
      currency: "THB",
      status: charge.status === "successful" ? "pending_verification" : "pending",
      payment_data: { authorize_uri: charge.authorize_uri ?? null },
    });

    return NextResponse.json({
      ok: true,
      message: charge.status === "successful" ? "ชำระเงินสำเร็จ กำลังยืนยันรายการ" : "กำลังตรวจสอบการชำระเงิน",
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
