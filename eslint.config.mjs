import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@next/next/no-img-element": "warn",
      // Several client components intentionally hydrate state from localStorage,
      // browser capabilities, and remote adapters. Keep the React 19 diagnostic
      // visible without blocking CI for these external-system synchronization cases.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
