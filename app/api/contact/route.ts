import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getActiveEmailAdapter } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(10).max(5000),
});

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60_000);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, message: "ส่งข้อความบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "ข้อมูลติดต่อไม่ถูกต้อง" }, { status: 400 });
  }

  const destination = process.env.CONTACT_TO_EMAIL;
  if (!destination) {
    return NextResponse.json(
      { ok: false, message: "ช่องทางติดต่อยังไม่ได้ตั้งค่า กรุณาติดต่อร้านผ่านช่องทางอื่น" },
      { status: 503 }
    );
  }

  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "ระบบส่งข้อความยังไม่ได้ตั้งค่าสำหรับ Production" },
      { status: 503 }
    );
  }

  const { name, email, message } = parsed.data;
  const result = await getActiveEmailAdapter().send({
    to: destination,
    subject: `ข้อความติดต่อจาก ${name} — SpinShop 360`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>ข้อความจากแบบฟอร์มติดต่อ SpinShop 360</h2>
        <p><strong>ชื่อ:</strong> ${escapeHtml(name)}</p>
        <p><strong>อีเมลตอบกลับ:</strong> ${escapeHtml(email)}</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่" }, { status: 502 });
  }

  return NextResponse.json(
    { ok: true, message: "ส่งข้อความสำเร็จ ทีมงานจะติดต่อกลับโดยเร็วที่สุด" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
