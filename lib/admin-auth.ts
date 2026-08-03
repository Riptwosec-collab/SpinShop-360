import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
  role: "admin" | "staff";
}

/**
 * Verifies the current request's Supabase session belongs to a user whose
 * `profiles.role` is `admin` or `staff` — read straight from the database,
 * never from a client-supplied header/body field. Returns `null` if
 * unauthenticated, not admin/staff, or Supabase isn't configured (Mock Mode
 * has no server-verifiable session, so admin-write routes are disabled
 * there — the UI falls back to its existing toast-only mock behavior).
 */
export async function requireAdminSession(): Promise<AdminSession | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "staff") return null;

  return { userId: user.id, role: profile.role };
}
