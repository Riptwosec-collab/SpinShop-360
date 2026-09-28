import { z } from 'zod';
export type SubmissionKind = 'contact' | 'newsletter';
export type SubmissionPayload = { email: string; name?: string; message?: string; consent?: boolean };
export type SubmissionSaver = (payload: SubmissionPayload) => Promise<'saved' | 'limited' | 'failed'>;
const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());
const schemas = {
  contact: z.object({ name: z.string().trim().min(1).max(120), email, message: z.string().trim().min(10).max(5000) }),
  newsletter: z.object({ email, consent: z.literal(true) }),
};
export async function submitStorefrontForm(kind: SubmissionKind, input: unknown, save: SubmissionSaver | null): Promise<{ status: number; code: string }> {
  const parsed = schemas[kind].safeParse(input);
  if (!parsed.success) return { status: 400, code: 'invalid' };
  if (!save) return { status: 503, code: 'unavailable' };
  try {
    const result = await save(parsed.data);
    if (result === 'limited') return { status: 429, code: 'rate_limited' };
    if (result !== 'saved') return { status: 503, code: 'save_failed' };
    return { status: 201, code: 'saved' };
  } catch { return { status: 503, code: 'save_failed' }; }
}
