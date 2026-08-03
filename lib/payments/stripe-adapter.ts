import Stripe from "stripe";
import type { PaymentAdapter, CreatePaymentInput, CreatePaymentResult, VerifyWebhookInput, WebhookEvent } from "./types";

/**
 * Real Stripe integration. Activated automatically once `STRIPE_SECRET_KEY`
 * is set (see `lib/payments/index.ts`). Uses Stripe Checkout Sessions so
 * card entry / 3D Secure happens on Stripe's hosted page — nothing sensitive
 * ever touches our server, satisfying PCI-DSS SAQ-A.
 */
export class StripePaymentAdapter implements PaymentAdapter {
  readonly providerName = "stripe";
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" as Stripe.LatestApiVersion });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: input.method === "promptpay" ? ["promptpay"] : ["card"],
        customer_email: input.customerEmail,
        line_items: [
          {
            price_data: {
              currency: input.currency.toLowerCase(),
              product_data: { name: `คำสั่งซื้อ ${input.orderNumber}` },
              unit_amount: Math.round(input.amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
        success_url: `${input.returnUrl}?order=${input.orderNumber}`,
        cancel_url: `${input.returnUrl}?cancelled=true`,
      });

      return {
        ok: true,
        message: "สร้างรายการชำระเงินสำเร็จ กำลังนำไปยังหน้าชำระเงิน",
        redirectUrl: session.url ?? undefined,
        providerTransactionId: session.id,
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "ไม่สามารถสร้างรายการชำระเงินได้",
      };
    }
  }

  verifyWebhookSignature({ payload, signature }: VerifyWebhookInput): WebhookEvent | null {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !signature) return null;

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          type: "payment.succeeded",
          providerTransactionId: session.id,
          orderId: session.metadata?.orderId,
          amount: (session.amount_total ?? 0) / 100,
        };
      }
      if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object as Stripe.PaymentIntent;
        return { type: "payment.failed", providerTransactionId: intent.id };
      }
      if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        return { type: "payment.refunded", providerTransactionId: charge.id };
      }
      return null;
    } catch {
      // Invalid signature — reject silently, caller responds 400.
      return null;
    }
  }
}
