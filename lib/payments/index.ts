import type { PaymentAdapter } from "./types";
import { MockPaymentAdapter } from "./mock-adapter";
import { StripePaymentAdapter } from "./stripe-adapter";
import { OmisePaymentAdapter } from "./omise-adapter";

export type { PaymentAdapter, CreatePaymentInput, CreatePaymentResult, WebhookEvent } from "./types";

/**
 * Resolves the active payment adapter from environment variables. Priority:
 * Stripe → Omise → Mock. This means simply setting `STRIPE_SECRET_KEY` (or
 * `OMISE_SECRET_KEY`) in `.env.local` is enough to switch the entire
 * checkout flow from Mock Payment to a real gateway — no code changes.
 *
 * To add 2C2P or another Thai gateway, implement `PaymentAdapter` in a new
 * `lib/payments/<provider>-adapter.ts` file and add it to this priority
 * list the same way.
 */
export function getActivePaymentAdapter(): PaymentAdapter {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) return new StripePaymentAdapter(stripeKey);

  const omiseKey = process.env.OMISE_SECRET_KEY;
  if (omiseKey) return new OmisePaymentAdapter(omiseKey);

  return new MockPaymentAdapter();
}
