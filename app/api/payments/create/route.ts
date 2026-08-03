import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getActivePaymentAdapter } from "@/lib/payments";

const bodySchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("THB"),
  method: z.enum(["promptpay", "credit_card", "debit_card", "bank_transfer", "cod"]),
  customerEmail: z.string().email(),
  returnUrl: z.string().url(),
});

/**
 * POST /api/payments/create
 * Creates a payment with whichever gateway is active (Stripe / Omise /
 * Mock — see `lib/payments/index.ts`). The client never talks to the
 * payment provider directly except for card tokenization, which keeps
 * secret keys server-side only.
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "ข้อมูลคำขอไม่ถูกต้อง", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Cash on Delivery never touches a payment gateway.
  if (parsed.data.method === "cod") {
    return NextResponse.json({ ok: true, message: "สั่งซื้อแบบเก็บเงินปลายทางสำเร็จ" });
  }

  const adapter = getActivePaymentAdapter();
  const result = await adapter.createPayment(parsed.data);

  return NextResponse.json(result, { status: result.ok ? 200 : 402 });
}
