import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authDestination, authOrigin } from "@/lib/supabase/redirect";
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
  const client = createSupabaseServerClient();
  const code = request.nextUrl.searchParams.get("code");
  if (client && code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          authDestination(request.nextUrl.searchParams.get("next")),
          origin,
        ),
      );
  }
  return NextResponse.redirect(new URL("/login?error=auth-link", origin));
}
