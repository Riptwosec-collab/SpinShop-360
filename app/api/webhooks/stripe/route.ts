import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secretKey || !webhookSecret || !signature) {
    return NextResponse.json({ ok: false, message: "Stripe webhook not configured" }, { status: 501 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" as Stripe.LatestApiVersion });
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, message: "Database not configured" }, { status: 501 });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return NextResponse.json({ ok: true, ignored: true });

    const { data: order } = await supabase
      .from("orders")
      .select("id, grand_total, payment_status")
      .eq("id", orderId)
      .maybeSingle();

    const paidAmount = (session.amount_total ?? 0) / 100;
    if (!order || Number(order.grand_total) !== paidAmount || session.currency?.toLowerCase() !== "thb") {
      await writeAuditLog({
        action: "payment.amount_mismatch",
        entityType: "order",
        entityId: orderId,
        metadata: { provider: "stripe", paidAmount, expectedAmount: order?.grand_total ?? null, sessionId: session.id },
      });
      return NextResponse.json({ ok: false, message: "Payment amount mismatch" }, { status: 400 });
    }

    if (order.payment_status !== "paid") {
      await supabase
        .from("orders")
        .update({ status: "paid", payment_status: "paid", paid_at: new Date().toISOString() })
        .eq("id", orderId)
        .neq("payment_status", "paid");
    }
    await writeAuditLog({
      action: "payment.succeeded",
      entityType: "order",
      entityId: orderId,
      metadata: { provider: "stripe", sessionId: session.id, amount: paidAmount },
    });
  }

  return NextResponse.json({ ok: true });
}
