export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  amountMinor: number;
  currency: string;
  method: 'promptpay' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'cod';
  customerEmail: string;
  returnUrl: string;
  idempotencyKey: string;
  token?: string;
}
export interface CreatePaymentResult {
  ok: boolean;
  message: string;
  status?: 'pending' | 'failed' | 'unknown' | 'paid';
  redirectUrl?: string;
  authorizeUri?: string;
  qrCodeData?: string;
  providerTransactionId?: string;
  providerIntentId?: string;
}
export interface VerifyWebhookInput { payload: string; signature: string | null; }
/** Only populated from a signed Stripe event or authenticated Omise API response. */
export interface WebhookEvent {
  eventId: string;
  provider: 'stripe' | 'omise';
  type: 'payment.succeeded' | 'payment.failed' | 'payment.refunded';
  attemptId: string;
  orderId: string;
  providerTransactionId?: string;
  providerIntentId?: string;
  amountMinor: number;
  currency: string;
  refundedAmountMinor?: number;
}
export interface PaymentAdapter {
  readonly providerName: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhookSignature(input: VerifyWebhookInput): Promise<WebhookEvent | null> | WebhookEvent | null;
}
