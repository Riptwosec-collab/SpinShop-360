import Stripe from 'stripe';
import type { PaymentAdapter, CreatePaymentInput, CreatePaymentResult, VerifyWebhookInput, WebhookEvent } from './types';

export class StripePaymentAdapter implements PaymentAdapter {
  readonly providerName = 'stripe';
  private stripe: Stripe;
  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: '2026-08-26.dahlia' as Stripe.LatestApiVersion, maxNetworkRetries: 0, timeout: 15000 });
  }
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // The same persisted attempt identifies both the Session and its PaymentIntent.
    const metadata = { orderId: input.orderId, paymentAttemptId: input.idempotencyKey };
    const params: Stripe.Checkout.SessionCreateParams & { integration_identifier: string } = {
      mode: 'payment', customer_email: input.customerEmail,
      integration_identifier: 'spinshop_checkout_spinstor',
      line_items: [{ price_data: { currency: input.currency.toLowerCase(), product_data: { name: `คำสั่งซื้อ ${input.orderNumber}` }, unit_amount: input.amountMinor }, quantity: 1 }],
      metadata, payment_intent_data: { metadata },
      success_url: input.returnUrl,
      cancel_url: `${input.returnUrl}?cancelled=true`,
    };
    try {
      const session = await this.stripe.checkout.sessions.create(params, { idempotencyKey: input.idempotencyKey });
      return { ok: true, status: 'pending', message: 'ดำเนินการชำระเงินกับ Stripe', redirectUrl: session.url ?? undefined, providerTransactionId: session.id, providerIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id };
    } catch {
      // A network failure is NOT evidence that Stripe did not create a Session.
      // Keep the reservation permanently; webhook/manual reconciliation resolves it.
      return { ok: false, status: 'unknown', message: 'กำลังตรวจสอบรายการชำระเงิน กรุณาตรวจสอบสถานะคำสั่งซื้อก่อนทำรายการใหม่' };
    }
  }
  async verifyWebhookSignature({ payload, signature }: VerifyWebhookInput): Promise<WebhookEvent | null> {
    if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) return null;
    let event: Stripe.Event;
    try { event = this.stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET); }
    catch { return null; }
    let result: Omit<WebhookEvent, 'orderId' | 'attemptId'>;
    let metadata: Stripe.Metadata | null;
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      const failed = ['checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type);
      if (!failed && session.payment_status !== 'paid') return null;
      metadata = session.metadata;
      result = { eventId: event.id, provider: 'stripe', type: failed ? 'payment.failed' : 'payment.succeeded', providerTransactionId: session.id, providerIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id, amountMinor: session.amount_total ?? -1, currency: session.currency ?? '' };
    } else if (['payment_intent.succeeded', 'payment_intent.payment_failed'].includes(event.type)) {
      const intent = event.data.object as Stripe.PaymentIntent;
      metadata = intent.metadata;
      result = { eventId: event.id, provider: 'stripe', type: event.type === 'payment_intent.succeeded' ? 'payment.succeeded' : 'payment.failed', providerIntentId: intent.id, amountMinor: event.type === 'payment_intent.succeeded' ? intent.amount_received : intent.amount, currency: intent.currency };
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if (!intentId) return null;
      metadata = charge.metadata;
      // Metadata is copied to new charges by Stripe; retrieve for older objects.
      if (!metadata?.paymentAttemptId) metadata = (await this.stripe.paymentIntents.retrieve(intentId)).metadata;
      result = { eventId: event.id, provider: 'stripe', type: 'payment.refunded', providerIntentId: intentId, amountMinor: charge.amount, currency: charge.currency, refundedAmountMinor: charge.amount_refunded };
    } else return null;
    if (!metadata?.orderId || !metadata.paymentAttemptId || !Number.isSafeInteger(result.amountMinor) || result.amountMinor <= 0) return null;
    return { ...result, orderId: metadata.orderId, attemptId: metadata.paymentAttemptId };
  }
}
