// This file configures the initialization of Sentry for edge features
// (middleware, edge routes). https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production" && !!dsn,
});
