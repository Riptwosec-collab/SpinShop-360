import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { USE_MOCK_DATA } from "@/lib/constants";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabaseConfig();
  if (USE_MOCK_DATA || !config) return response;
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|usdz)$).*)",
  ],
};
