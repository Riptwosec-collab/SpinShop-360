import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { StripePaymentAdapter } from "@/lib/payments/stripe-adapter";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

export const runtime = "nodejs";

/** Verifies Stripe's signature before trusting any payment state transition. */
export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, message: "Stripe not configured" }, { status: 501 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const event = new StripePaymentAdapter(secretKey).verifyWebhookSignature({ payload, signature });

  if (!event) {
    return NextResponse.json({ ok: false, message: "invalid webhook signature or unsupported event" }, { status: 400 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, message: "database not configured" }, { status: 501 });
  }

  if (event.type === "payment.succeeded") {
    if (!event.orderId || event.amount == null || !event.currency) {
      return NextResponse.json({ ok: false, message: "missing verified payment metadata" }, { status: 400 });
    }

    const { error } = await serviceClient.rpc("finalize_paid_order", {
      p_order_id: event.orderId,
      p_provider: "stripe",
      p_provider_transaction_id: event.providerTransactionId,
      p_amount: event.amount,
      p_currency: event.currency,
    });

    if (error) {
      Sentry.captureException(new Error(`Stripe finalize_paid_order failed: ${error.message}`));
      return NextResponse.json({ ok: false, message: "unable to finalize order" }, { status: 409 });
    }

    await serviceClient
      .from("payments")
      .update({ status: "succeeded", updated_at: new Date().toISOString() })
      .eq("provider", "stripe")
      .eq("provider_transaction_id", event.providerTransactionId);

    await writeAuditLog({
      action: "payment.succeeded",
      entityType: "order",
      entityId: event.orderId,
      metadata: {
        provider: "stripe",
        transactionId: event.providerTransactionId,
        amount: event.amount,
        currency: event.currency,
      },
    });
  } else if (event.type === "payment.failed") {
    if (event.orderId) {
      await serviceClient
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("provider", "stripe")
        .eq("order_id", event.orderId)
        .neq("status", "succeeded");
    }
    await writeAuditLog({
      action: "payment.failed",
      entityType: event.orderId ? "order" : "payment",
      entityId: event.orderId ?? event.providerTransactionId,
      metadata: { provider: "stripe", transactionId: event.providerTransactionId },
    });
  } else if (event.type === "payment.refunded") {
    if (event.orderId) {
      await serviceClient
        .from("orders")
        .update({ status: "refunded", payment_status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", event.orderId)
        .eq("payment_status", "paid");
      await serviceClient
        .from("payments")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("provider", "stripe")
        .eq("order_id", event.orderId);
    }
    await writeAuditLog({
      action: "payment.refunded",
      entityType: event.orderId ? "order" : "payment",
      entityId: event.orderId ?? event.providerTransactionId,
      metadata: { provider: "stripe", transactionId: event.providerTransactionId },
    });
  }

  return NextResponse.json({ ok: true });
}
