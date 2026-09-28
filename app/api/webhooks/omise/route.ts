import type { NextRequest } from 'next/server';
import { OmisePaymentAdapter } from '@/lib/payments/omise-adapter';
import { paymentResponse, persistVerifiedPaymentEvent } from '@/lib/payments/server';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!process.env.OMISE_SECRET_KEY) return paymentResponse({ ok: false }, 503);
  try {
    const event = await new OmisePaymentAdapter(process.env.OMISE_SECRET_KEY).verifyWebhookSignature({ payload: await request.text(), signature: null });
    if (!event) return paymentResponse({ ok: true, ignored: true });
    await persistVerifiedPaymentEvent(event);
    return paymentResponse({ ok: true });
  } catch { return paymentResponse({ ok: false }, 503); }
}
