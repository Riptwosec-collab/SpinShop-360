import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().startsWith("tokn_", "Token ไม่ถูกต้อง"),
  orderId: z.string(),
  orderNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("THB"),
  customerEmail: z.string().email(),
});

const OMISE_API_BASE = "https://api.omise.co";

/**
 * POST /api/payments/omise/charge-card
 *
 * Exchanges a client-tokenized card (`tokn_...`, produced by
 * `OmiseCardForm` via Omise.js) for an actual charge. This is the only
 * place raw payment authorization happens for Omise card payments — the
 * token itself is single-use and worthless without our secret key, so
 * even if a token leaked in transit it can't be replayed elsewhere.
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

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  try {
    const chargeRes = await fetch(`${OMISE_API_BASE}/charges`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        amount: String(Math.round(parsed.data.amount * 100)),
        currency: parsed.data.currency.toLowerCase(),
        card: parsed.data.token,
        metadata: JSON.stringify({ orderId: parsed.data.orderId, orderNumber: parsed.data.orderNumber }),
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
      authorizeUri: charge.authorize_uri ?? null, // 3-D Secure redirect, if required
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Omise" },
      { status: 500 }
    );
  }
}
