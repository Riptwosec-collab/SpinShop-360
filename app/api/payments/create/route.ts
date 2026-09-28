import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createOrderPayment, paymentResponse } from '@/lib/payments/server';
const schema = z.object({ orderId: z.string().min(1).max(100) });
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return paymentResponse({ ok: false, code: 'INVALID_REQUEST', message: 'ข้อมูลคำขอไม่ถูกต้อง' }, 400);
  return createOrderPayment(request, parsed.data.orderId);
}
