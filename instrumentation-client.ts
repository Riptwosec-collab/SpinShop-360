// This file configures the initialization of Sentry on the client (browser).
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Sentry.init() no-ops (never sends events) when `dsn` is undefined, so this
// is safe to call unconditionally in Mock Mode / local dev without a Sentry
// account — no code branching needed elsewhere in the app.
Sentry.init({
  dsn,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: dsn ? 0.5 : 0,
  integrations: dsn ? [Sentry.replayIntegration()] : [],
  environment: process.env.NODE_ENV,
  // Don't spam Sentry with noisy dev-only console errors.
  enabled: process.env.NODE_ENV === "production" && !!dsn,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
