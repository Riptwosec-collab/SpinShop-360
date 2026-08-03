import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";

const OMISE_API_BASE = "https://api.omise.co";

/**
 * POST /api/webhooks/omise
 *
 * Omise webhooks are NOT signed the way Stripe's are (no HMAC secret to
 * verify against). Omise's own documentation recommends treating the
 * webhook purely as a "something changed, go check" notification: we take
 * the charge id out of the payload, then re-fetch that charge directly
 * from the Omise API using our secret key. Only the re-fetched, verified
 * response is ever trusted — the webhook body itself is never used to
 * decide anything, which closes the forgery hole a signature would
 * otherwise close for us.
 */
export async function POST(request: NextRequest) {
  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, message: "Omise not configured" }, { status: 501 });
  }

  const payload = await request.json().catch(() => null);
  const chargeId: string | undefined = payload?.data?.id;

  if (!chargeId || typeof chargeId !== "string" || !chargeId.startsWith("chrg_")) {
    // Not a charge event (could be a customer/transfer event we don't care
    // about) — acknowledge so Omise stops retrying, but do nothing.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  const verifyRes = await fetch(`${OMISE_API_BASE}/charges/${chargeId}`, {
    headers: { Authorization: authHeader },
  });

  if (!verifyRes.ok) {
    return NextResponse.json({ ok: false, message: "unable to verify charge" }, { status: 400 });
  }

  const charge = await verifyRes.json();
  const orderId: string | undefined = charge.metadata?.orderId;
  const supabase = createSupabaseServiceClient();

  if (charge.status === "successful" && orderId) {
    if (supabase) {
      await supabase
        .from("orders")
        .update({ status: "paid", payment_status: "paid", paid_at: new Date().toISOString() })
        .eq("id", orderId);
    }
    await writeAuditLog({
      action: "payment.succeeded",
      entityType: "order",
      entityId: orderId,
      metadata: { provider: "omise", chargeId, amount: charge.amount / 100 },
    });
  } else if (charge.status === "failed") {
    await writeAuditLog({ action: "payment.failed", entityType: "payment", entityId: chargeId, metadata: { provider: "omise" } });
  } else if (charge.refunded && orderId) {
    if (supabase) {
      await supabase.from("orders").update({ status: "refunded" }).eq("id", orderId);
    }
    await writeAuditLog({ action: "payment.refunded", entityType: "payment", entityId: chargeId, metadata: { provider: "omise" } });
  }

  return NextResponse.json({ ok: true });
}
