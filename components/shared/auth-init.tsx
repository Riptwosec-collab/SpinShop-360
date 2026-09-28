"use client";
import { useEffect } from "react";
import { USE_MOCK_DATA } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";

/** Hydrate the UI from verified Auth state, including other-tab sign-out. */
export function AuthInit() {
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    const client = createSupabaseBrowserClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    void useAuthStore.getState().initialize();
    const subscription = client?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT")
        useAuthStore.setState({ user: null, initialized: true });
      // Supabase callbacks must return synchronously: defer further auth calls.
      clearTimeout(timer);
      timer = setTimeout(() => {
        void useAuthStore.getState().initialize();
      }, 0);
    }).data.subscription;
    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);
  return null;
}
