import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "modelviewer.dev" },
    ],
  },
  eslint: {
    dirs: ["app", "components", "lib", "types"],
  },
};

// withSentryConfig only uploads source maps when SENTRY_AUTH_TOKEN (+ org/
// project) are present in the environment; without them it's a no-op wrapper
// so local dev and CI builds work identically with or without Sentry set up.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});

