import { randomBytes, createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { getActivePaymentAdapter } from './index';
import { derivePaymentInput, GUEST_ACCESS_SECONDS, guestCookieName, hashGuestToken, matchesGuestToken, type PayableOrder } from './security';
import type { CreatePaymentResult, WebhookEvent } from './types';

// These server-only tables/functions are intentionally not available to browser clients.
export function paymentDatabase(): SupabaseClient | null {
  return createSupabaseServiceClient() as SupabaseClient | null;
}
export function paymentResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function sameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // CLI/mobile clients still require order authorization.
  try { return origin === new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin; }
  catch { return false; }
}
export async function authorizeOrder(request: NextRequest, order: { id: string; user_id: string | null }, db: SupabaseClient): Promise<boolean> {
  if (order.user_id) {
    const auth = createSupabaseServerClient();
    if (!auth) return false;
    const { data, error } = await auth.auth.getUser();
    return !error && data.user?.id === order.user_id;
  }
  const token = request.cookies.get(guestCookieName(order.id))?.value;
  if (!token) return false;
  const { data, error } = await db.from('order_payment_access').select('token_hash, expires_at').eq('order_id', order.id).maybeSingle();
  return !error && !!data && Date.parse(data.expires_at) > Date.now() && matchesGuestToken(token, data.token_hash);
}
export function guestTokenForCheckout(requestKey: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Guest access not configured');
  return createHmac('sha256', secret).update(`spinshop-checkout-v1:${requestKey}`).digest('hex');
}
export function setGuestOrderCookie(response: NextResponse, orderId: string, token: string) {
  response.cookies.set(guestCookieName(orderId), token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: GUEST_ACCESS_SECONDS });
}
/** Call only after server-created guest order; never expose its capability in JSON. */
export async function issueGuestOrderAccess(db: SupabaseClient, orderId: string, response: NextResponse): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const { error } = await db.from('order_payment_access').insert({ order_id: orderId, token_hash: hashGuestToken(token), expires_at: new Date(Date.now() + GUEST_ACCESS_SECONDS * 1000).toISOString() });
  if (error) throw new Error('Unable to issue guest order access');
  setGuestOrderCookie(response, orderId, token);
}

interface Reservation {
  acquired: boolean;
  payment: { id: string; status: string; payment_data: { response?: CreatePaymentResult } };
  order: PayableOrder;
}

export async function createOrderPayment(request: NextRequest, orderId: string, token?: string) {
  if (!sameOriginRequest(request)) return paymentResponse({ ok: false, code: 'FORBIDDEN', message: 'ไม่อนุญาตคำขอจากเว็บไซต์นี้' }, 403);
  const db = paymentDatabase();
  const adapter = getActivePaymentAdapter();
  if (!db) {
    // An unconfigured demo cannot reach a gateway, even if a gateway key was set.
    if (adapter.providerName !== 'mock' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'false') return paymentResponse({ ok: false, code: 'PAYMENT_UNAVAILABLE', message: 'ระบบชำระเงินยังไม่พร้อมใช้งาน' }, 503);
    return paymentResponse({ ok: true, status: 'paid', simulated: true, message: 'ชำระเงินสำเร็จ (จำลอง — ไม่มีการตัดเงินจริง)' });
  }
  const { data: order, error } = await db.from('orders').select('id,user_id,order_number,grand_total,email,payment_method,payment_status,status').eq('id', orderId).maybeSingle();
  if (error) return paymentResponse({ ok: false, code: 'PAYMENT_UNAVAILABLE', message: 'ไม่สามารถตรวจสอบคำสั่งซื้อได้' }, 503);
  if (!order || !(await authorizeOrder(request, order, db))) return paymentResponse({ ok: false, code: 'ORDER_ACCESS_DENIED', message: 'ไม่พบคำสั่งซื้อหรือไม่มีสิทธิ์เข้าถึง' }, 403);
  if (order.payment_method === 'cod' && !token) return paymentResponse({ ok: true, status: 'pending', message: 'สั่งซื้อแบบเก็บเงินปลายทางสำเร็จ' });
  if (adapter.providerName === 'mock') return paymentResponse({ ok: false, code: 'PAYMENT_UNAVAILABLE', message: 'ระบบชำระเงินยังไม่พร้อมใช้งาน' }, 503);
  if (token && (adapter.providerName !== 'omise' || !['credit_card', 'debit_card'].includes(order.payment_method))) return paymentResponse({ ok: false, code: 'PAYMENT_METHOD_INVALID', message: 'วิธีชำระเงินไม่ตรงกับคำสั่งซื้อ' }, 400);
  if (adapter.providerName === 'omise' && !token && order.payment_method !== 'promptpay') return paymentResponse({ ok: false, code: 'PAYMENT_METHOD_INVALID', message: 'กรุณาเลือก PromptPay หรือกรอกข้อมูลบัตร' }, 400);
  if (order.payment_status === 'paid') return paymentResponse({ ok: true, status: 'paid', message: 'ชำระเงินแล้ว' });
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) return paymentResponse({ ok: false, code: 'PAYMENT_UNAVAILABLE', message: 'ระบบชำระเงินยังไม่พร้อมใช้งาน' }, 503);
  try { derivePaymentInput(order, origin, 'validation'); }
  catch { return paymentResponse({ ok: false, code: 'ORDER_NOT_PAYABLE', message: 'คำสั่งซื้อนี้ไม่พร้อมสำหรับการชำระเงิน' }, 409); }

  // The RPC locks the order and inserts a unique payment reservation BEFORE any
  // gateway call. No lease expiry or automated retry can make another charge.
  const reserved = await db.rpc('reserve_order_payment', { p_order_id: orderId, p_provider: adapter.providerName });
  if (reserved.error || !reserved.data) return paymentResponse({ ok: false, code: 'PAYMENT_UNAVAILABLE', message: 'ไม่สามารถจองรายการชำระเงินได้' }, 503);
  const reservation = reserved.data as Reservation;
  if (!reservation.acquired) {
    if (reservation.payment.status === 'paid') return paymentResponse({ ok: true, status: 'paid', message: 'ชำระเงินแล้ว' });
    const saved = reservation.payment.payment_data?.response;
    if (saved) return paymentResponse(saved, saved.status === 'unknown' ? 202 : saved.ok ? 200 : 402);
    return paymentResponse({ ok: false, status: 'unknown', code: 'PAYMENT_PROCESSING', message: 'กำลังตรวจสอบการชำระเงิน กรุณาตรวจสอบสถานะคำสั่งซื้อ' }, 202);
  }
  let result: CreatePaymentResult;
  try {
    const input = derivePaymentInput(reservation.order, origin, reservation.payment.id);
    result = await adapter.createPayment({ ...input, token });
  } catch {
    result = { ok: false, status: 'unknown', message: 'กำลังตรวจสอบรายการชำระเงิน กรุณาตรวจสอบสถานะคำสั่งซื้อ' };
  }
  const recorded = await db.rpc('finish_order_payment', { p_payment_id: reservation.payment.id, p_transaction_id: result.providerTransactionId ?? null, p_intent_id: result.providerIntentId ?? null, p_response: result });
  if (recorded.error) return paymentResponse({ ok: false, status: 'unknown', code: 'PAYMENT_PROCESSING', message: 'กำลังตรวจสอบรายการชำระเงิน กรุณาตรวจสอบสถานะคำสั่งซื้อ' }, 202);
  return paymentResponse(result, result.status === 'unknown' ? 202 : result.ok ? 200 : 402);
}

export async function persistVerifiedPaymentEvent(event: WebhookEvent) {
  const db = paymentDatabase();
  if (!db) throw new Error('Payment database unavailable');
  const { data, error } = await db.rpc('apply_payment_event', {
    p_provider: event.provider, p_event_id: event.eventId, p_payment_id: event.attemptId,
    p_order_id: event.orderId, p_transaction_id: event.providerTransactionId ?? null,
    p_intent_id: event.providerIntentId ?? null, p_event_type: event.type,
    p_amount_minor: event.amountMinor, p_currency: event.currency,
    p_refunded_minor: event.refundedAmountMinor ?? 0,
  });
  if (error) throw new Error('Payment event not committed');
  return data;
}
