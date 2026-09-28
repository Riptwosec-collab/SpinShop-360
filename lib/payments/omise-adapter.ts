import type { PaymentAdapter, CreatePaymentInput, CreatePaymentResult, VerifyWebhookInput, WebhookEvent } from './types';
const OMISE_API_BASE = 'https://api.omise.co';

/** Omise has no signed webhook: verify the event AND current charge with our key. */
export class OmisePaymentAdapter implements PaymentAdapter {
  readonly providerName = 'omise';
  constructor(private secretKey: string) {}
  private authHeader() { return `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`; }
  private async retrieve(path: string) {
    const response = await fetch(`${OMISE_API_BASE}${path}`, { headers: { Authorization: this.authHeader(), 'Omise-Version': '2019-05-29' }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Unable to verify Omise event');
    return response.json();
  }
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (input.method !== 'promptpay' && !input.token) return { ok: false, status: 'failed', message: 'วิธีชำระเงินนี้ยังไม่พร้อมใช้งาน กรุณาเลือก PromptPay หรือบัตร' };
    const body = new URLSearchParams({ amount: String(input.amountMinor), currency: input.currency.toLowerCase(), description: `Order ${input.orderNumber}`, return_uri: input.returnUrl, 'metadata[orderId]': input.orderId, 'metadata[paymentAttemptId]': input.idempotencyKey });
    if (input.token) body.set('card', input.token);
    else body.set('source[type]', 'promptpay');
    try {
      // Exactly one POST per durable reservation. Never retry an ambiguous result.
      const response = await fetch(`${OMISE_API_BASE}/charges`, { method: 'POST', headers: { Authorization: this.authHeader(), 'Content-Type': 'application/x-www-form-urlencoded', 'Omise-Version': '2019-05-29' }, body, signal: AbortSignal.timeout(15000) });
      const charge = await response.json();
      if (!response.ok) return { ok: false, status: response.status >= 500 ? 'unknown' : 'failed', message: 'ไม่สามารถยืนยันการชำระเงินได้ กรุณาตรวจสอบสถานะคำสั่งซื้อ' };
      if (typeof charge.id !== 'string' || !/^chrg_[a-zA-Z0-9_]+$/.test(charge.id)) throw new Error('Invalid gateway response');
      return { ok: charge.status !== 'failed', status: charge.status === 'failed' ? 'failed' : 'pending', message: charge.status === 'failed' ? 'บัตรถูกปฏิเสธ กรุณาติดต่อร้านค้า' : 'รอการยืนยันการชำระเงิน', providerTransactionId: charge.id, redirectUrl: charge.authorize_uri || undefined, authorizeUri: charge.authorize_uri || undefined, qrCodeData: charge.source?.scannable_code?.image?.download_uri || undefined };
    } catch { return { ok: false, status: 'unknown', message: 'กำลังตรวจสอบรายการชำระเงิน กรุณาตรวจสอบสถานะคำสั่งซื้อก่อนทำรายการใหม่' }; }
  }
  async verifyWebhookSignature({ payload }: VerifyWebhookInput): Promise<WebhookEvent | null> {
    let eventId: unknown;
    try { eventId = JSON.parse(payload)?.id; } catch { return null; }
    if (typeof eventId !== 'string' || !/^evnt_[a-zA-Z0-9_]+$/.test(eventId)) return null;
    const event = await this.retrieve(`/events/${eventId}`);
    if (event.id !== eventId || typeof event.key !== 'string') return null;
    if (!event.key.startsWith('charge.') && event.key !== 'refund.create') return null;
    const chargeId = event.key === 'refund.create' ? event.data?.charge : event.data?.id;
    if (typeof chargeId !== 'string' || !/^chrg_[a-zA-Z0-9_]+$/.test(chargeId)) return null;
    const charge = await this.retrieve(`/charges/${chargeId}`);
    if (charge.id !== chargeId || !charge.metadata?.orderId || !charge.metadata?.paymentAttemptId || !Number.isSafeInteger(charge.amount) || charge.amount <= 0 || typeof charge.currency !== 'string') return null;
    const refunded = Number(charge.refunded_amount ?? 0);
    const type = refunded > 0 ? 'payment.refunded' : charge.status === 'successful' && charge.paid === true ? 'payment.succeeded' : ['failed', 'expired', 'reversed'].includes(charge.status) ? 'payment.failed' : null;
    if (!type) return null;
    return { eventId, provider: 'omise', type, orderId: charge.metadata.orderId, attemptId: charge.metadata.paymentAttemptId, providerTransactionId: charge.id, amountMinor: charge.amount, currency: charge.currency, refundedAmountMinor: refunded };
  }
}
