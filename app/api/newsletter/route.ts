import { handleSubmission } from '@/lib/submission-route';
export const runtime = 'nodejs';
export async function POST(request: Request) { return handleSubmission(request, 'newsletter'); }
