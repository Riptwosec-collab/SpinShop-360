export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number; // in THB (major unit, e.g. 199.00)
  currency: string;
  method: "promptpay" | "credit_card" | "debit_card" | "bank_transfer" | "cod";
  customerEmail: string;
  returnUrl: string;
}

export interface CreatePaymentResult {
  ok: boolean;
  message: string;
  /** URL to redirect the customer to (hosted checkout / 3DS challenge), if any */
  redirectUrl?: string;
  /** Raw QR payload for PromptPay, if applicable */
  qrCodeData?: string;
  providerTransactionId?: string;
}

export interface VerifyWebhookInput {
  payload: string;
  signature: string | null;
}

export interface WebhookEvent {
  type: "payment.succeeded" | "payment.failed" | "payment.refunded";
  providerTransactionId: string;
  orderId?: string;
  amount?: number;
}

/**
 * Common interface every payment gateway adapter implements. Route Handlers
 * call these methods without needing to know which provider is configured —
 * swap providers by changing `getActivePaymentAdapter()` in `index.ts`.
 */
export interface PaymentAdapter {
  readonly providerName: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhookSignature(input: VerifyWebhookInput): WebhookEvent | null;
}
