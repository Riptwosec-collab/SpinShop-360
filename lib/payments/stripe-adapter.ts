import Stripe from "stripe";
import type { PaymentAdapter, CreatePaymentInput, CreatePaymentResult, VerifyWebhookInput, WebhookEvent } from "./types";

/** Stripe Checkout integration. Card entry and 3-D Secure stay on Stripe. */
export class StripePaymentAdapter implements PaymentAdapter {
  readonly providerName = "stripe";
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" as Stripe.LatestApiVersion });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const metadata = { orderId: input.orderId, orderNumber: input.orderNumber };
      const session = await this.stripe.checkout.sessions.create(
        {
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
          metadata,
          payment_intent_data: { metadata },
          success_url: `${input.returnUrl}?payment=success`,
          cancel_url: `${input.returnUrl}?payment=cancelled`,
        },
        { idempotencyKey: `spinshop-order-${input.orderId}` }
      );

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
          currency: session.currency?.toUpperCase(),
        };
      }
      if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object as Stripe.PaymentIntent;
        return {
          type: "payment.failed",
          providerTransactionId: intent.id,
          orderId: intent.metadata?.orderId,
          amount: intent.amount / 100,
          currency: intent.currency.toUpperCase(),
        };
      }
      if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        return {
          type: "payment.refunded",
          providerTransactionId: charge.id,
          orderId: charge.metadata?.orderId,
          amount: charge.amount_refunded / 100,
          currency: charge.currency.toUpperCase(),
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}
