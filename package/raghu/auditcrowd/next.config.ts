import type { NextConfig } from "next";

/**
 * ONE config for every environment — no per-env file copying.
 *
 * Why a single config works for uat / qa / prod:
 *   The ZeroBias client builds all API URLs from `location.host` at runtime
 *   (same-origin `/api/...`). So the exact same static build, served from
 *   uat.zerobias.com / qa.zerobias.com / app.zerobias.com, automatically talks
 *   to that host's own `/api`. Promote one artifact across all three envs.
 *
 * Local dev is the only special case:
 *   `next dev` runs a server, so we proxy `/api/*` to a real platform and run
 *   in non-export mode. Set NEXT_PUBLIC_IS_LOCAL_DEV=true in `.env.development`.
 */
const isLocalDev = process.env.NEXT_PUBLIC_IS_LOCAL_DEV === "true";

// Where `/api/*` is proxied to during local dev (pick the platform env whose
// data + session you want locally). Override in `.env.development`.
const devApiOrigin =
  process.env.NEXT_PUBLIC_DEV_API_ORIGIN ?? "https://app.zerobias.com";

// Served from `s3://app-<env>-zerobias.com/<pkg-name>/`, so the production
// deliverable lives under this base path. Keep equal to the package/folder name.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/auditcrowd";

const base: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Static export cannot use the Next image optimizer.
  images: { unoptimized: true },
  // Pin the workspace root to this app so a stray parent lockfile doesn't
  // confuse Next's root inference.
  outputFileTracingRoot: import.meta.dirname,
};

const nextConfig: NextConfig = isLocalDev
  ? {
      ...base,
      async rewrites() {
        return [
          { source: "/api/:path*", destination: `${devApiOrigin}/api/:path*` },
        ];
      },
    }
  : {
      ...base,
      output: "export",
      distDir: "dist",
      basePath,
    };

export default nextConfig;
