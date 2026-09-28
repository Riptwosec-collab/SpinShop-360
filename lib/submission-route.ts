import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { submitStorefrontForm, type SubmissionKind, type SubmissionSaver } from '@/lib/services/submissions';

export async function handleSubmission(request: Request, kind: SubmissionKind) {
  // JSON endpoints only: browser cross-origin form posts cannot submit silently.
  if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ ok: false, code: 'invalid' }, { status: 415 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ ok: false, code: 'invalid' }, { status: 403 });
  const body = await request.text();
  if (body.length > 20_000) return NextResponse.json({ ok: false, code: 'invalid' }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(body); } catch { return NextResponse.json({ ok: false, code: 'invalid' }, { status: 400 }); }
  const db = createSupabaseServiceClient() as SupabaseClient | null;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // Only a hash is stored. Hosting must replace x-forwarded-for with its trusted client IP.
  const key = createHash('sha256').update(`${kind}:${ip}:${process.env.SUBMISSION_RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'unconfigured'}`).digest('hex');
  const save: SubmissionSaver | null = db ? async payload => {
    const { data, error } = await db.rpc('submit_storefront_form', { p_kind: kind, p_payload: payload, p_rate_key: key });
    if (error) return 'failed';
    return data === 'saved' ? 'saved' : data === 'limited' ? 'limited' : 'failed';
  } : null;
  const result = await submitStorefrontForm(kind, input, save);
  return NextResponse.json({ ok: result.code === 'saved', code: result.code }, { status: result.status, headers: { 'Cache-Control': 'no-store', ...(result.status === 429 ? { 'Retry-After': '60' } : {}) } });
}
