import { z } from "zod";
import { addressSchema } from "@/lib/validators/checkout";
import type { CheckoutFormValues } from "@/lib/validators/checkout";
import type { CartItem } from "@/types/cart";

const KEY = "spinshop360-pending-checkout";
export interface CheckoutRequest {
  email: string; phone: string; items: CartItem[];
  shippingAddress: CheckoutFormValues["shippingAddress"];
  paymentMethod: CheckoutFormValues["paymentMethod"];
  shippingMethod: CheckoutFormValues["shippingMethod"];
  couponCode: string | null; customerNote?: string;
}
export interface CheckoutSession {
  key: string;
  request: CheckoutRequest;
  order?: { id: string; orderNumber: string; grandTotal: number };
  cartConsumed?: boolean;
}
const schema = z.object({
  key: z.string().uuid(),
  request: z.object({
    email: z.string().email(), phone: z.string(), shippingAddress: addressSchema,
    paymentMethod: z.enum(["promptpay", "credit_card", "debit_card", "cod"]),
    shippingMethod: z.enum(["standard", "express"]), couponCode: z.string().nullable(),
    items: z.array(z.object({ id: z.string(), variantId: z.string(), quantity: z.number().int().positive() }).passthrough()).min(1),
  }).passthrough(),
  order: z.object({ id: z.string().min(1), orderNumber: z.string().min(1), grandTotal: z.number().finite().nonnegative() }).optional(),
  cartConsumed: z.boolean().optional(),
});

// Preserve the exact submitted JSON and nonce, including when the server reply
// was lost. Never persist card details/tokens or silently expire an uncertain order.
export function loadCheckoutSession(): CheckoutSession | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  schema.parse(value);
  return value as CheckoutSession;
}
export function saveCheckoutSession(session: CheckoutSession): void {
  schema.parse(session);
  const serialized = JSON.stringify(session);
  sessionStorage.setItem(KEY, serialized);
  if (sessionStorage.getItem(KEY) !== serialized) throw new Error("Checkout recovery is unavailable");
}
export function clearCheckoutSession(orderNumber: string): void {
  try {
    if (loadCheckoutSession()?.order?.orderNumber === orderNumber) sessionStorage.removeItem(KEY);
  } catch { /* An unavailable browser store must not hide the order status. */ }
}

// Only use after an explicit server rejection of the transactional create call,
// never after a timeout, an unknown response, or a payment failure.
export function discardRejectedCheckout(key: string): void {
  const saved = loadCheckoutSession();
  if (saved?.key === key && !saved.order) sessionStorage.removeItem(KEY);
}
