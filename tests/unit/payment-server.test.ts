// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ db: null as any, user: null as any, adapter: { providerName: 'stripe', createPayment: vi.fn() } }));
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServiceClient: () => mocks.db, createSupabaseServerClient: () => ({ auth: { getUser: async () => ({ data: { user: mocks.user }, error: null }) } }) }));
vi.mock('@/lib/payments/index', () => ({ getActivePaymentAdapter: () => mocks.adapter }));
import { authorizeOrder, createOrderPayment, guestTokenForCheckout } from '@/lib/payments/server';
import { hashGuestToken } from '@/lib/payments/security';
const ownerId = 'owner';
const order = { id: 'order-1', user_id: ownerId, order_number: 'SP-001', grand_total: 199.99, email: 'owner@example.com', payment_method: 'promptpay', payment_status: 'unpaid', status: 'pending' };
function request(headers: Record<string, string> = {}) { return new NextRequest('https://shop.example/api/payments/create', { method: 'POST', headers }); }
function dbFor(row: any, rpc = vi.fn()) {
  const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: row, error: null }) };
  return { from: () => chain, rpc };
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.user = { id: ownerId }; mocks.adapter.providerName = 'stripe';
  process.env.NEXT_PUBLIC_APP_URL = 'https://shop.example'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test';
});
describe('order-authorized durable payment orchestration', () => {
  it('never charges a known order ID owned by another customer', async () => {
    mocks.user = { id: 'attacker' }; mocks.db = dbFor(order);
    expect((await createOrderPayment(request(), order.id)).status).toBe(403);
    expect(mocks.adapter.createPayment).not.toHaveBeenCalled();
  });
  it('requires the HttpOnly capability for guest orders; guessed order ID is insufficient', async () => {
    const token = 'a'.repeat(64);
    const db = dbFor({ token_hash: hashGuestToken(token), expires_at: new Date(Date.now() + 60000).toISOString() });
    expect(await authorizeOrder(request(), { id: order.id, user_id: null }, db as any)).toBe(false);
    expect(await authorizeOrder(request({ cookie: `spinshop_order_${order.id}=${token}` }), { id: order.id, user_id: null }, db as any)).toBe(true);
    expect(await authorizeOrder(request({ cookie: `spinshop_order_${order.id}=${'b'.repeat(64)}` }), { id: order.id, user_id: null }, db as any)).toBe(false);
  });
  it('rejects expired capabilities and binds token derivation to a server secret', async () => {
    const token = 'a'.repeat(64);
    expect(await authorizeOrder(request({ cookie: `spinshop_order_${order.id}=${token}` }), { id: order.id, user_id: null }, dbFor({ token_hash: hashGuestToken(token), expires_at: '2000-01-01' }) as any)).toBe(false);
    expect(guestTokenForCheckout('nonce')).toBe(guestTokenForCheckout('nonce'));
    expect(guestTokenForCheckout('different')).not.toBe(guestTokenForCheckout('nonce'));
  });
  it('makes one gateway call for concurrent requests and retains ambiguous reservations', async () => {
    let reserved = false;
    let saved: any;
    const rpc = vi.fn(async (name: string, params: any) => {
      if (name === 'reserve_order_payment') {
        const acquired = !reserved; reserved = true;
        return { data: { acquired, order, payment: { id: 'attempt-1', status: saved ? 'unknown' : 'reserved', payment_data: saved ? { response: saved } : {} } }, error: null };
      }
      saved = params.p_response; return { error: null };
    });
    mocks.db = dbFor(order, rpc);
    mocks.adapter.createPayment.mockResolvedValue({ ok: false, status: 'unknown', message: 'pending review' });
    const results = await Promise.all([createOrderPayment(request(), order.id), createOrderPayment(request(), order.id)]);
    expect(results.every((result) => result.status === 202)).toBe(true);
    await createOrderPayment(request(), order.id);
    expect(mocks.adapter.createPayment).toHaveBeenCalledTimes(1);
    expect(mocks.adapter.createPayment).toHaveBeenCalledWith(expect.objectContaining({ orderId: order.id, amountMinor: 19999, customerEmail: 'owner@example.com', method: 'promptpay', returnUrl: 'https://shop.example/order-success/SP-001', idempotencyKey: 'attempt-1' }));
  });
  it('refuses real gateways without the durable database', async () => {
    mocks.db = null;
    expect((await createOrderPayment(request(), order.id)).status).toBe(503);
    expect(mocks.adapter.createPayment).not.toHaveBeenCalled();
  });
  it('rejects cross-origin requests before any gateway calls', async () => {
    mocks.db = dbFor(order);
    expect((await createOrderPayment(request({ origin: 'https://attacker.example' }), order.id)).status).toBe(403);
    expect(mocks.adapter.createPayment).not.toHaveBeenCalled();
  });
});
