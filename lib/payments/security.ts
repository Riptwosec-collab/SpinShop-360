import { createHash, timingSafeEqual } from 'node:crypto';
import type { CreatePaymentInput } from './types';

export const GUEST_ACCESS_SECONDS = 60 * 60 * 24;
export function guestCookieName(orderId: string) { return `spinshop_order_${orderId}`; }
export function hashGuestToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function matchesGuestToken(token: string, expectedHash: string) {
  if (!/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(expectedHash)) return false;
  return timingSafeEqual(Buffer.from(hashGuestToken(token), 'hex'), Buffer.from(expectedHash, 'hex'));
}

export function paymentAmountMinor(amount: number): number {
  const minor = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(minor) || Math.abs(amount * 100 - minor) > 1e-6) throw new Error('Invalid order total');
  return minor;
}

export interface PayableOrder {
  id: string;
  order_number: string;
  email: string;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  status: string;
}

export function derivePaymentInput(order: PayableOrder, origin: string, attemptId: string): CreatePaymentInput {
  const base = new URL(origin);
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || (process.env.NODE_ENV === 'production' && base.protocol !== 'https:')) throw new Error('Invalid application origin');
  if (!['pending', 'awaiting_payment'].includes(order.status) || !['unpaid', 'pending', 'failed'].includes(order.payment_status)) throw new Error('Order is not payable');
  if (!['promptpay', 'credit_card', 'debit_card', 'bank_transfer'].includes(order.payment_method)) throw new Error('Unsupported payment method');
  return {
    orderId: order.id, orderNumber: order.order_number, amount: Number(order.grand_total),
    amountMinor: paymentAmountMinor(Number(order.grand_total)), currency: 'THB',
    method: order.payment_method as CreatePaymentInput['method'], customerEmail: order.email,
    returnUrl: new URL(`/order-success/${encodeURIComponent(order.order_number)}`, base.origin).href,
    idempotencyKey: attemptId,
  };
}
