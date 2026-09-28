import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authOrigin } from "@/lib/supabase/redirect";
export async function GET(request: NextRequest) {
  let origin: string;
  try {
    origin = authOrigin(request.nextUrl.origin);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "ระบบยืนยันตัวตนยังไม่พร้อม / Authentication configuration is incomplete",
      },
      { status: 503 },
    );
  }
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const client = createSupabaseServerClient();
  if (
    client &&
    token_hash &&
    (type === "email" || type === "signup" || type === "recovery")
  ) {
    const { error } = await client.auth.verifyOtp({ token_hash, type });
    if (!error)
      return NextResponse.redirect(
        new URL(type === "recovery" ? "/reset-password" : "/account", origin),
      );
  }
  return NextResponse.redirect(new URL("/login?error=auth-link", origin));
}
