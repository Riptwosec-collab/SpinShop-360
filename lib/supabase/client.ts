import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createBrowserClient<Database>(config.url, config.key);
}
