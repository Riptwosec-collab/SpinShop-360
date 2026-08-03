import type { PaymentAdapter, CreatePaymentInput, CreatePaymentResult, VerifyWebhookInput, WebhookEvent } from "./types";

const OMISE_API_BASE = "https://api.omise.co";

/**
 * Omise (opn.ooo) is a common Thailand-focused payment gateway with native
 * PromptPay QR support. Activated when `OMISE_SECRET_KEY` is set.
 * Docs: https://docs.opn.ooo/charges-api
 *
 * Omise webhooks don't use HMAC signatures the way Stripe does — instead
 * Omise recommends verifying by re-fetching the event/charge from the API
 * using your secret key rather than trusting the payload directly. This
 * adapter's `verifyWebhookSignature` does a best-effort structural check;
 * for production, re-fetch and confirm via `GET /charges/:id` as Omise docs
 * recommend before trusting the event.
 */
export class OmisePaymentAdapter implements PaymentAdapter {
  readonly providerName = "omise";
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  private authHeader() {
    return `Basic ${Buffer.from(`${this.secretKey}:`).toString("base64")}`;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const sourceType =
        input.method === "promptpay" ? "promptpay" : input.method === "bank_transfer" ? "internet_banking" : null;

      // Card payments require a client-side tokenized card (Omise.js) —
      // this server-side path only handles source-based methods (PromptPay /
      // internet banking). Card charges should be created client-side with
      // the Omise.js token, then confirmed via a similar `/charges` call.
      if (!sourceType) {
        return {
          ok: false,
          message: "วิธีชำระเงินนี้ต้องสร้าง Token ฝั่ง Client ด้วย Omise.js ก่อนเรียก API นี้",
        };
      }

      const sourceRes = await fetch(`${OMISE_API_BASE}/sources`, {
        method: "POST",
        headers: { Authorization: this.authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          type: sourceType,
          amount: String(Math.round(input.amount * 100)),
          currency: input.currency.toLowerCase(),
        }),
      });
      const source = await sourceRes.json();
      if (!sourceRes.ok) {
        return { ok: false, message: source?.message ?? "ไม่สามารถสร้างแหล่งชำระเงินได้" };
      }

      const chargeRes = await fetch(`${OMISE_API_BASE}/charges`, {
        method: "POST",
        headers: { Authorization: this.authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          amount: String(Math.round(input.amount * 100)),
          currency: input.currency.toLowerCase(),
          source: source.id,
          metadata: JSON.stringify({ orderId: input.orderId, orderNumber: input.orderNumber }),
          return_uri: input.returnUrl,
        }),
      });
      const charge = await chargeRes.json();
      if (!chargeRes.ok) {
        return { ok: false, message: charge?.message ?? "ไม่สามารถสร้างรายการชำระเงินได้" };
      }

      return {
        ok: true,
        message: "สร้างรายการชำระเงินสำเร็จ",
        redirectUrl: charge.authorize_uri ?? undefined,
        qrCodeData: charge.source?.scannable_code?.image?.download_uri ?? undefined,
        providerTransactionId: charge.id,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Omise" };
    }
  }

  verifyWebhookSignature({ payload }: VerifyWebhookInput): WebhookEvent | null {
    try {
      const event = JSON.parse(payload);
      const charge = event?.data;
      if (!charge?.id) return null;

      if (charge.status === "successful") {
        return {
          type: "payment.succeeded",
          providerTransactionId: charge.id,
          orderId: charge.metadata?.orderId,
          amount: (charge.amount ?? 0) / 100,
        };
      }
      if (charge.status === "failed") {
        return { type: "payment.failed", providerTransactionId: charge.id };
      }
      if (charge.refunded) {
        return { type: "payment.refunded", providerTransactionId: charge.id };
      }
      return null;
    } catch {
      return null;
    }
  }
}
