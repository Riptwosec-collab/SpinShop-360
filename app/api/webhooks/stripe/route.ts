import type { NextRequest } from 'next/server';
import { StripePaymentAdapter } from '@/lib/payments/stripe-adapter';
import { paymentResponse, persistVerifiedPaymentEvent } from '@/lib/payments/server';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return paymentResponse({ ok: false }, 503);
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  // Verify once explicitly so a genuine unsupported event can be acknowledged
  // while invalid signatures always receive a failure response.
  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try { stripe.webhooks.constructEvent(payload, signature ?? '', process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return paymentResponse({ ok: false }, 400); }
  try {
    const event = await new StripePaymentAdapter(process.env.STRIPE_SECRET_KEY).verifyWebhookSignature({ payload, signature });
    if (!event) return paymentResponse({ ok: true, ignored: true });
    await persistVerifiedPaymentEvent(event);
    return paymentResponse({ ok: true });
  } catch { return paymentResponse({ ok: false }, 503); } // provider retries DB/API errors
}
