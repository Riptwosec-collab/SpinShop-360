import type { PaymentAdapter, CreatePaymentInput, CreatePaymentResult, VerifyWebhookInput, WebhookEvent } from "./types";

/**
 * Always-succeeds payment adapter used in Mock Mode / local development.
 * Never wire this into a real deployment — it exists purely so the full
 * checkout → order-success flow can be tested without any payment
 * provider credentials.
 */
export class MockPaymentAdapter implements PaymentAdapter {
  readonly providerName = "mock";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    await new Promise((r) => setTimeout(r, 400));
    return {
      ok: true,
      message: "ชำระเงินสำเร็จ (จำลอง — ไม่มีการตัดเงินจริง)",
      providerTransactionId: `mock_${Date.now()}`,
      qrCodeData: input.method === "promptpay" ? "00020101021129370016A000000677010111" : undefined,
    };
  }

  verifyWebhookSignature(_input: VerifyWebhookInput): WebhookEvent | null {
    return null; // Mock adapter never receives real webhooks.
  }
}
