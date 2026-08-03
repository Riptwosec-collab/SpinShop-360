import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getActivePaymentAdapter } from "@/lib/payments";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyCheckoutToken } from "@/lib/checkout-token";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  paymentToken: z.string().min(20).optional(),
  method: z.enum(["promptpay", "credit_card", "debit_card", "bank_transfer"]),
});

function checkoutCookieName(orderId: string) {
  return `spinshop_checkout_${orderId}`;
}

/**
 * Creates a gateway payment from the canonical order stored in the database.
 * The browser cannot choose the amount, currency, order number or return URL.
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const suppliedToken =
    parsed.data.paymentToken ?? request.cookies.get(checkoutCookieName(parsed.data.orderId))?.value;
  const token = suppliedToken ? verifyCheckoutToken(suppliedToken, parsed.data.orderId) : null;
  if (!token) {
    return NextResponse.json({ ok: false, message: "สิทธิ์ชำระเงินหมดอายุหรือไม่ถูกต้อง" }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, message: "ระบบชำระเงินจริงยังไม่ได้ตั้งค่า" }, { status: 501 });
  }

  const { data: order, error } = await serviceClient
    .from("orders")
    .select("id, order_number, email, grand_total, payment_method, payment_status, status")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (error || !order || order.order_number !== token.orderNumber) {
    return NextResponse.json({ ok: false, message: "ไม่พบคำสั่งซื้อนี้" }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: false, message: "คำสั่งซื้อนี้ชำระเงินแล้ว" }, { status: 409 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ ok: false, message: "คำสั่งซื้อนี้หมดอายุหรือถูกยกเลิกแล้ว" }, { status: 409 });
  }
  if (order.payment_method !== parsed.data.method) {
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

  const adapter = getActivePaymentAdapter();
  if (
    adapter.providerName === "mock" &&
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_MOCK_PAYMENTS !== "true"
  ) {
    return NextResponse.json(
      { ok: false, message: "ยังไม่ได้ตั้งค่าผู้ให้บริการชำระเงินสำหรับ Production" },
      { status: 503 }
    );
  }

  const result = await adapter.createPayment({
    orderId: order.id,
    orderNumber: order.order_number,
    amount: Number(order.grand_total),
    currency: "THB",
    method: parsed.data.method,
    customerEmail: order.email,
    returnUrl: `${request.nextUrl.origin}/order-success/${encodeURIComponent(order.order_number)}`,
  });

  await serviceClient.from("payments").insert({
    order_id: order.id,
    provider: adapter.providerName,
    provider_transaction_id: result.providerTransactionId ?? null,
    method: parsed.data.method,
    amount: Number(order.grand_total),
    currency: "THB",
    status: result.ok ? "pending" : "failed",
    payment_data: {
      created_from: "checkout",
      has_redirect: Boolean(result.redirectUrl),
      has_qr: Boolean(result.qrCodeData),
    },
  });

  const response = NextResponse.json(result, {
    status: result.ok ? 200 : 402,
    headers: { "Cache-Control": "no-store" },
  });
  if (result.ok) {
    response.cookies.set({
      name: checkoutCookieName(order.id),
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/payments",
      maxAge: 0,
    });
  }
  return response;
}
