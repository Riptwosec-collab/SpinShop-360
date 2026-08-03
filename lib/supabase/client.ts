import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client for Client Components. Safe to call
 * repeatedly — `createBrowserClient` reuses the underlying connection.
 * Returns `null` when Supabase env vars aren't set (Mock Mode), so callers
 * must guard with `if (!supabase) return mockFallback()`.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createBrowserClient<Database>(url, anonKey);
}
