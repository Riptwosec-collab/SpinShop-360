// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import Stripe from 'stripe';
import { StripePaymentAdapter } from '@/lib/payments/stripe-adapter';
import { OmisePaymentAdapter } from '@/lib/payments/omise-adapter';

const stripe = new Stripe('sk_test_fake');
const metadata = { orderId: '5d5d5d5d-1111-4444-8888-444444444444', paymentAttemptId: '3d3d3d3d-1111-4444-8888-444444444444' };
function signed(type: string, object: Record<string, unknown>) {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  const payload = JSON.stringify({ id: 'evt_valid', type, data: { object } });
  return { payload, signature: stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test' }) };
}
afterEach(() => { vi.unstubAllGlobals(); });
describe('verified gateway events', () => {
  it('rejects forged Stripe signatures', async () => {
    expect(await new StripePaymentAdapter('sk_test_fake').verifyWebhookSignature({ payload: '{}', signature: 'forged' })).toBeNull();
  });
  it('does not mark an unpaid completed session paid', async () => {
    expect(await new StripePaymentAdapter('sk_test_fake').verifyWebhookSignature(signed('checkout.session.completed', { id: 'cs_1', metadata, amount_total: 10000, currency: 'thb', payment_status: 'unpaid' }))).toBeNull();
  });
  it('accepts a signed asynchronous payment with exact minor amount and mappings', async () => {
    expect(await new StripePaymentAdapter('sk_test_fake').verifyWebhookSignature(signed('checkout.session.async_payment_succeeded', { id: 'cs_1', metadata, amount_total: 10000, currency: 'thb', payment_status: 'paid', payment_intent: 'pi_1' }))).toMatchObject({ type: 'payment.succeeded', eventId: 'evt_valid', providerTransactionId: 'cs_1', providerIntentId: 'pi_1', amountMinor: 10000, currency: 'thb', attemptId: metadata.paymentAttemptId, orderId: metadata.orderId });
  });
  it('maps partial Stripe refunds to their payment intent, retaining exact cumulative refund', async () => {
    expect(await new StripePaymentAdapter('sk_test_fake').verifyWebhookSignature(signed('charge.refunded', { id: 'ch_1', metadata, amount: 10000, amount_refunded: 3000, currency: 'thb', payment_intent: 'pi_1' }))).toMatchObject({ type: 'payment.refunded', providerIntentId: 'pi_1', amountMinor: 10000, refundedAmountMinor: 3000 });
  });
  it('re-fetches Omise event and charge and gives refund precedence over successful', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ id: 'evnt_test_1', key: 'refund.create', data: { charge: 'chrg_test_1' } }))).mockResolvedValueOnce(new Response(JSON.stringify({ id: 'chrg_test_1', metadata, amount: 10000, currency: 'thb', status: 'successful', paid: true, refunded_amount: 10000 })));
    vi.stubGlobal('fetch', fetch);
    const result = await new OmisePaymentAdapter('skey_test').verifyWebhookSignature({ payload: JSON.stringify({ id: 'evnt_test_1', data: { id: 'forged', amount: 1 } }), signature: null });
    expect(fetch.mock.calls[0][0]).toBe('https://api.omise.co/events/evnt_test_1');
    expect(fetch.mock.calls[1][0]).toBe('https://api.omise.co/charges/chrg_test_1');
    expect(result).toMatchObject({ type: 'payment.refunded', amountMinor: 10000, refundedAmountMinor: 10000, providerTransactionId: 'chrg_test_1' });
  });
  it('rejects a fabricated Omise event not found at the gateway', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));
    await expect(new OmisePaymentAdapter('skey_test').verifyWebhookSignature({ payload: JSON.stringify({ id: 'evnt_test_fake', data: { id: 'chrg_test_1', status: 'successful', metadata } }), signature: null })).rejects.toThrow();
  });
});
