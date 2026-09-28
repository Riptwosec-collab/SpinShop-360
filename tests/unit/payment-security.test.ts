// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { derivePaymentInput, guestCookieName, hashGuestToken, matchesGuestToken, paymentAmountMinor } from '@/lib/payments/security';

const order = { id: 'order-id', order_number: 'SP-001', grand_total: 123.45, email: 'owner@example.com', payment_method: 'promptpay', payment_status: 'unpaid', status: 'pending' };

describe('server payment security', () => {
  it('derives every sensitive payment field from the persisted order', () => {
    const input = derivePaymentInput(order, 'https://shop.example', 'attempt-id');
    expect(input).toMatchObject({ orderId: 'order-id', orderNumber: 'SP-001', amount: 123.45, amountMinor: 12345, customerEmail: 'owner@example.com', method: 'promptpay', currency: 'THB', idempotencyKey: 'attempt-id', returnUrl: 'https://shop.example/order-success/SP-001' });
  });
  it.each([0, -1, NaN, Infinity, 1.001, Number.MAX_SAFE_INTEGER])('rejects invalid or imprecise total %s', (amount) => {
    expect(() => paymentAmountMinor(amount)).toThrow();
  });
  it('represents decimal currency exactly in minor units', () => {
    expect(paymentAmountMinor(19.99)).toBe(1999);
    expect(paymentAmountMinor(0.29)).toBe(29);
  });
  it('rejects an untrusted return origin or terminal order', () => {
    expect(() => derivePaymentInput(order, 'javascript:alert(1)', 'id')).toThrow();
    expect(() => derivePaymentInput({ ...order, status: 'cancelled' }, 'https://shop.example', 'id')).toThrow();
    expect(() => derivePaymentInput({ ...order, payment_status: 'paid' }, 'https://shop.example', 'id')).toThrow();
  });
  it('guest capabilities require the actual secret, not a known order identifier or digest', () => {
    const secret = 'a'.repeat(64);
    const digest = hashGuestToken(secret);
    expect(matchesGuestToken(secret, digest)).toBe(true);
    expect(matchesGuestToken('b'.repeat(64), digest)).toBe(false);
    expect(matchesGuestToken(digest, digest)).toBe(false);
    expect(matchesGuestToken('', digest)).toBe(false);
    expect(guestCookieName('123-456')).toBe('spinshop_order_123-456');
  });
});
