import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

/** Public catalog queries deliberately carry no customer session or service key. */
export function createCatalogClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase catalog configuration is missing");
  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
