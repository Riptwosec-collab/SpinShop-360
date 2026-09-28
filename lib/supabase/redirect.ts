/** Restrict redirects to known destinations; never accept an arbitrary return URL. */
export function authDestination(value: string | null) {
  return value === "/reset-password" ? "/reset-password" : "/account";
}
export function authOrigin(requestOrigin: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured && process.env.NODE_ENV === "production")
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required for authentication redirects",
    );
  const url = new URL(configured || requestOrigin);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("Authentication redirects require an HTTPS app URL");
  return url.origin;
}
