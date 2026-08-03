import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getActivePaymentAdapter } from "@/lib/payments";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/constants";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string().min(1),
  method: z.enum(["promptpay", "credit_card", "debit_card", "bank_transfer", "cod"]),
  customerEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  if (parsed.data.method === "cod") {
    return NextResponse.json({ ok: true, message: "สั่งซื้อแบบเก็บเงินปลายทางสำเร็จ" });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, message: "ระบบชำระเงินจริงยังไม่ได้ตั้งค่า" }, { status: 501 });
  }

  const { data: order, error } = await serviceClient
    .from("orders")
    .select("id, order_number, email, grand_total, payment_status, status")
    .eq("id", parsed.data.orderId)
    .eq("order_number", parsed.data.orderNumber)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ ok: false, message: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }
  if (order.email.toLowerCase() !== parsed.data.customerEmail.toLowerCase()) {
    return NextResponse.json({ ok: false, message: "ข้อมูลเจ้าของคำสั่งซื้อไม่ถูกต้อง" }, { status: 403 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: false, message: "คำสั่งซื้อนี้ชำระเงินแล้ว" }, { status: 409 });
  }
  if (["cancelled", "refunded"].includes(order.status)) {
    return NextResponse.json({ ok: false, message: "คำสั่งซื้อนี้ไม่สามารถชำระเงินได้" }, { status: 409 });
  }

  const adapter = getActivePaymentAdapter();
  const returnUrl = `${APP_URL.replace(/\/$/, "")}/order-success/${order.order_number}`;
  const result = await adapter.createPayment({
    orderId: order.id,
    orderNumber: order.order_number,
    amount: Number(order.grand_total),
    currency: "THB",
    method: parsed.data.method,
    customerEmail: order.email,
    returnUrl,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 402 });
}
