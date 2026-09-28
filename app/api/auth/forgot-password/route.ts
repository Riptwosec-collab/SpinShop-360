import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authOrigin } from "@/lib/supabase/redirect";
import { USE_MOCK_DATA } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
const schema = z.object({ email: z.string().email() });
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`forgot-password:${ip}`, 3, 60_000).success)
    return NextResponse.json(
      {
        ok: false,
        message:
          "ลองใหม่บ่อยเกินไป กรุณารอสักครู่ / Too many attempts; try again shortly",
      },
      { status: 429 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, message: "อีเมลไม่ถูกต้อง / Invalid email address" },
      { status: 400 },
    );
  if (USE_MOCK_DATA)
    return NextResponse.json({
      ok: true,
      mock: true,
      message:
        "จำลองการส่งลิงก์แล้ว ไม่มีการส่งอีเมลจริง / Demo only; no email was sent",
    });
  try {
    const client = createSupabaseServerClient();
    if (!client)
      return NextResponse.json(
        {
          ok: false,
          message:
            "ระบบยืนยันตัวตนยังไม่พร้อม / Authentication is not configured",
        },
        { status: 503 },
      );
    const origin = authOrigin(request.nextUrl.origin);
    const { error } = await client.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: `${origin}/api/auth/callback?next=/reset-password` },
    );
    if (error)
      return NextResponse.json(
        {
          ok: false,
          message:
            "ไม่สามารถส่งคำขอได้ กรุณาลองใหม่ / Unable to submit reset request; try again",
        },
        { status: 503 },
      );
    return NextResponse.json({
      ok: true,
      message:
        "หากมีบัญชีนี้ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่าน / If an account exists, a reset link will be sent",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "ไม่สามารถส่งคำขอได้ กรุณาลองใหม่ / Unable to submit reset request; try again",
      },
      { status: 503 },
    );
  }
}
