import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

const OMISE_API_BASE = "https://api.omise.co";

/**
 * Omise does not sign charge webhooks. Treat the payload as a notification,
 * then re-fetch the charge from Omise before applying any state transition.
 */
export async function POST(request: NextRequest) {
  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, message: "Omise not configured" }, { status: 501 });
  }

  const payload = await request.json().catch(() => null);
  const chargeId: string | undefined = payload?.data?.id;
  if (!chargeId || typeof chargeId !== "string" || !chargeId.startsWith("chrg_")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  const verifyRes = await fetch(`${OMISE_API_BASE}/charges/${encodeURIComponent(chargeId)}`, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });

  if (!verifyRes.ok) {
    return NextResponse.json({ ok: false, message: "unable to verify charge" }, { status: 400 });
  }

  const charge = await verifyRes.json();
  const orderId: string | undefined = charge.metadata?.orderId;
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, message: "database not configured" }, { status: 501 });
  }

  if (charge.status === "successful") {
    if (!orderId || typeof charge.amount !== "number" || !charge.currency) {
      return NextResponse.json({ ok: false, message: "missing verified payment metadata" }, { status: 400 });
    }

    const amount = charge.amount / 100;
    const currency = String(charge.currency).toUpperCase();
    const { error } = await serviceClient.rpc("finalize_paid_order", {
      p_order_id: orderId,
      p_provider: "omise",
      p_provider_transaction_id: chargeId,
      p_amount: amount,
      p_currency: currency,
    });

    if (error) {
      Sentry.captureException(new Error(`Omise finalize_paid_order failed: ${error.message}`));
      return NextResponse.json({ ok: false, message: "unable to finalize order" }, { status: 409 });
    }

    await serviceClient
      .from("payments")
      .update({ status: "succeeded", updated_at: new Date().toISOString() })
      .eq("provider", "omise")
      .eq("provider_transaction_id", chargeId);

    await writeAuditLog({
      action: "payment.succeeded",
      entityType: "order",
      entityId: orderId,
      metadata: { provider: "omise", chargeId, amount, currency },
    });
  } else if (charge.status === "failed") {
    await serviceClient
      .from("payments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("provider", "omise")
      .eq("provider_transaction_id", chargeId)
      .neq("status", "succeeded");

    await writeAuditLog({
      action: "payment.failed",
      entityType: orderId ? "order" : "payment",
      entityId: orderId ?? chargeId,
      metadata: { provider: "omise", chargeId },
    });
  } else if (charge.refunded && orderId) {
    await serviceClient
      .from("orders")
      .update({ status: "refunded", payment_status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("payment_status", "paid");
    await serviceClient
      .from("payments")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("provider", "omise")
      .eq("order_id", orderId);

    await writeAuditLog({
      action: "payment.refunded",
      entityType: "order",
      entityId: orderId,
      metadata: { provider: "omise", chargeId },
    });
  }

  return NextResponse.json({ ok: true });
}
