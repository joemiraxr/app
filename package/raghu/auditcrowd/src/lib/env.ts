/**
 * Typed access to the NEXT_PUBLIC_* env vars this app reads.
 * All are inlined at build time by Next, so they are safe to read in the browser.
 */
export const env = {
  /** Local-dev mode: use the API-key interceptor + `/api` proxy instead of a cookie session. */
  isLocalDev: process.env.NEXT_PUBLIC_IS_LOCAL_DEV === "true",
  /** Production flag passed to the client's ZbEnvironment. */
  production: process.env.NEXT_PUBLIC_IS_LOCAL_DEV !== "true",
  /** Portal origin used for local-dev redirect/postMessage targeting. */
  localPortalOrigin: process.env.NEXT_PUBLIC_LOCAL_PORTAL_ORIGIN ?? "",
  /** Local-dev-only API key, injected as `Authorization: APIKey <key>`. Never set in prod. */
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
} as const;
