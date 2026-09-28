import { describe, expect, it, vi } from 'vitest';
import { submitStorefrontForm } from '@/lib/services/submissions';

describe('durable storefront submissions', () => {
  it('requires newsletter consent before storing an email', async () => {
    const save = vi.fn();
    const result = await submitStorefrontForm('newsletter', { email: 'shopper@example.com', consent: false }, save);
    expect(result.status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });
  it('does not report success if storage is unavailable', async () => {
    const result = await submitStorefrontForm('contact', { name: 'Mek', email: 'mek@example.com', message: 'Please help with my order.' }, null);
    expect(result).toEqual({ status: 503, code: 'unavailable' });
  });
  it('reports save errors and preserves the ability to retry', async () => {
    const result = await submitStorefrontForm('newsletter', { email: ' MEK@example.com ', consent: true }, async () => 'failed');
    expect(result).toEqual({ status: 503, code: 'save_failed' });
  });
  it('normalizes validated input and succeeds only after storage completes', async () => {
    let stored: unknown;
    const result = await submitStorefrontForm('newsletter', { email: ' MEK@example.com ', consent: true }, async (payload) => { stored = payload; return 'saved'; });
    expect(stored).toEqual({ email: 'mek@example.com', consent: true });
    expect(result).toEqual({ status: 201, code: 'saved' });
  });
  it('rejects oversized messages', async () => {
    const save = vi.fn();
    expect((await submitStorefrontForm('contact', { name: 'M', email: 'm@example.com', message: 'x'.repeat(5001) }, save)).status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });
  it('exposes persistent throttling without claiming success', async () => {
    expect(await submitStorefrontForm('newsletter', { email: 'm@example.com', consent: true }, async () => 'limited')).toEqual({ status: 429, code: 'rate_limited' });
  });
});
