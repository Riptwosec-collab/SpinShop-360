export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number; // in THB major units, e.g. 199.00
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
  /** Raw QR payload or hosted QR image URL, if applicable */
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
  currency?: string;
}

/** Common interface implemented by every payment gateway adapter. */
export interface PaymentAdapter {
  readonly providerName: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhookSignature(input: VerifyWebhookInput): WebhookEvent | null;
}
