// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ db: null as any, user: null as any, mockOrder: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServiceClient: () => mocks.db, createSupabaseServerClient: () => ({ auth: { getUser: async () => ({ data: { user: mocks.user }, error: null }) } }) }));
vi.mock('@/lib/services/orders', () => ({ createOrder: mocks.mockOrder }));
vi.mock('@/lib/audit-log', () => ({ writeAuditLog: vi.fn() }));
vi.mock('@/lib/email', () => ({ getActiveEmailAdapter: () => ({ send: vi.fn() }), orderConfirmationEmail: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
import { POST } from '@/app/api/orders/route';
const key = '70ec6d55-934d-43b9-9ea8-e572867e7eaa';
const body = { email: 'guest@example.com', phone: '0812345678', items: [{ productId: 'p1', variantId: 'v1', quantity: 1, productName: 'Mouse', variantLabel: 'Black', slug: 'mouse', imageUrl: 'https://example.com/a.jpg', unitPrice: 1, stockQuantity: 999, id: 'i1' }], shippingAddress: { recipientName: 'Guest Name', phone: '0812345678', addressLine1: '123 Test Road', subdistrict: 'Test', district: 'Test', province: 'Bangkok', postalCode: '10110' }, paymentMethod: 'promptpay', shippingMethod: 'standard' };
function request(keyValue = key, data: unknown = body) { return new NextRequest('https://shop.example/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': keyValue }, body: JSON.stringify(data) }); }
beforeEach(() => { vi.clearAllMocks(); process.env.NEXT_PUBLIC_APP_URL = 'https://shop.example'; process.env.NEXT_PUBLIC_USE_MOCK_DATA = 'false'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-server-secret'; mocks.user = null; });
describe('server order creation', () => {
  it('fails closed when real mode has no service database', async () => {
    mocks.db = null;
    expect((await POST(request())).status).toBe(503);
    expect(mocks.mockOrder).not.toHaveBeenCalled();
  });
  it('accepts the checkout payload without client shipping fees, binds replay key, and issues only HttpOnly capability', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { order_id: '12345678-1234-4321-8765-123456789012', order_number: 'SP-001', grand_total: 1990, replayed: true }, error: null });
    mocks.db = { rpc };
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(rpc.mock.calls[0][0]).toBe('create_order_once');
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_request_key: key, p_user_id: null, p_guest_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/), p_request_hash: expect.stringMatching(/^[a-f0-9]{64}$/) });
    const cookie = response.headers.get('set-cookie');
    expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('SameSite=lax');
    const json = await response.json();
    expect(json.order.grandTotal).toBe(1990);
    expect(JSON.stringify(json)).not.toContain('token');
    expect(response.headers.get('cache-control')).toBe('no-store');
    await POST(request());
    expect(rpc.mock.calls[1][1].p_request_hash).toBe(rpc.mock.calls[0][1].p_request_hash);
    expect(rpc.mock.calls[1][1].p_guest_token_hash).toBe(rpc.mock.calls[0][1].p_guest_token_hash);
  });
  it('rejects unsupported bank transfers before reserving stock', async () => {
    const rpc = vi.fn(); mocks.db = { rpc };
    expect((await POST(request(key, { ...body, paymentMethod: 'bank_transfer' }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rejects malformed replay keys and empty carts before the order RPC', async () => {
    const rpc = vi.fn(); mocks.db = { rpc };
    expect((await POST(request('bad-key'))).status).toBe(400);
    expect((await POST(request(key, { ...body, items: [] }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
