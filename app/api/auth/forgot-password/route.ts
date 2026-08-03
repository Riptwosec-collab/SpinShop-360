import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveEmailAdapter, passwordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimit(`forgot-password:${ip}`, 3, 60_000);
  if (!success) {
    return NextResponse.json({ ok: false, message: "ลองใหม่บ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "อีเมลไม่ถูกต้อง" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${request.nextUrl.origin}/reset-password`,
    });
    if (error) console.error("[forgot-password]", error.message);
  } else {
    await getActiveEmailAdapter().send({
      to: parsed.data.email,
      subject: "รีเซ็ตรหัสผ่าน — SpinShop 360",
      html: passwordResetEmail(`${request.nextUrl.origin}/reset-password?email=${encodeURIComponent(parsed.data.email)}`),
    });
  }

  return NextResponse.json({ ok: true, message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว" });
}
