"use client";

import { useEffect } from "react";

let initialized = false;

/**
 * Initializes PostHog once on the client when `NEXT_PUBLIC_POSTHOG_KEY` is
 * set. No-ops entirely otherwise, so Mock Mode / local dev never loads the
 * PostHog script.
 */
export function AnalyticsInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
    if (!key || initialized) return;
    initialized = true;

    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        capture_pageview: true,
        persistence: "localStorage",
      });
    });
  }, []);

  return null;
}
