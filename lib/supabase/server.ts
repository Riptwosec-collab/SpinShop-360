import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client (Server Components, Route Handlers, Server
 * Actions). Reads/writes the auth session via Next.js cookies. Returns
 * `null` when Supabase env vars aren't set (Mock Mode).
 */
export function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = cookies();

  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Components cannot write cookies; middleware refreshes them. */
        }
      },
    },
  });
}

/**
 * Privileged client using the service role key — bypasses RLS entirely.
 * NEVER import this in a Client Component or expose it to the browser.
 * Use only inside Route Handlers / Server Actions for trusted server-side
 * operations (e.g. decrementing stock inside an order transaction, or
 * admin-only bulk operations).
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
