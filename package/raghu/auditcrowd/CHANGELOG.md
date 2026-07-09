# Changelog

All notable changes to **example-nextjs-v2** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the app
uses [Semantic Versioning](https://semver.org/). The version below tracks
`package.json` `"version"`. **Maintained manually for now** (Phase 1) — there is
no CI changelog/version automation yet.

Each release is written so that a developer — or their AI assistant — who cloned
a specific version can quickly see **what changed** and **which ZeroBias v2
client / SDK calls and patterns** that version introduces, to make incorporating
the changes into their own app easier.

## [Unreleased]

### Added
- **Unit test harness** — Vitest (`npm test` / `npm run test:watch`) with an
  initial suite for the error mapper.
- **`src/lib/errors.ts`** — `toUserMessage(err)` maps any thrown value to a
  safe, user-facing message.

### Changed
- **Error handling** — the Products, PKV, and Create-API-Key views now show a
  mapped, friendly message via `toUserMessage()` and log the raw error to the
  console for developers, instead of rendering raw error text (which can leak
  backend detail) directly in the UI.

## [0.1.0] - 2026-07-08

Initial release. Canonical Next.js (App Router, static export) reference app for
building a custom app on the ZeroBias platform with the **v2 client**
(`@zerobias-com/zerobias-client`) + per-service SDKs.

### Added — features and the calls they demonstrate

- **Client bootstrap** (`src/lib/zerobias-app-service.ts`) — a browser-only,
  StrictMode-safe singleton that builds and initializes the client:
  `ZerobiasClientOrgId` + `ZerobiasClientSessionId` -> `ZerobiasClientApi` ->
  `ZerobiasClientApp` -> `app.init(interceptor)`. All SDK access goes through
  `service.api` (`danaClient`, `portalClient`, …). Never hand-roll `fetch`.
- **Session state** (`src/context/session-context.tsx`) — `user` / `org` / `api`
  sourced from the client's RxJS streams (`app.getWhoAmI()`,
  `app.getCurrentOrg()`) with subscription teardown on unmount. Exposes
  `selectOrg(org)` and `logout()`.
- **Auth — platform SSO only** (`src/components/AuthGate.tsx`) — no custom login
  page. On `init()` with no session the client redirects to
  `/api/dana/me/session/login?nextPath=<app>&cookieDomain=<host>` and returns
  with a session cookie. The API key is used **only in local dev**
  (`Authorization: APIKey <key>` interceptor); it is never present in a
  production build.
- **Identity + org switch** — `api.danaClient.getOrgApi().listOrgs(page, size)`
  (sorted by name on the client; `listOrgs` has no sort param) and
  `app.selectOrg(org)`.
- **Products catalog** (`/products`) —
  `api.portalClient.getProductApi().search(body, page, size)` ->
  `PagedResults<ProductExtended>` (`.items` for rows; fields `code`, `imageUrl`).
- **Principal Key-Value** (`/pkv`) — read
  `api.danaClient.getPkvApi().listPrincipalKeyValues()`, write
  `.upsertPrincipalKeyValue(new Pkv(key, value))` (`Pkv.value` is a JSON object).
- **Create API key** (in the user menu, `src/components/CreateApiKeyDialog.tsx`)
  — `api.danaClient.getMeApi().createApiKey(new CreateApiKeyBody(name, expiration))`
  -> `ApiKeyWithData`; the secret (`data`) is returned once and shown with a copy
  action alongside the current Organization ID. Expiration is a `DateTime` built
  from a duration + unit (hours / days / years).

### Build & deploy

- Next.js 16 + React 19. Static export (`output: "export"` -> `dist/`),
  `basePath` / URL path `/example-nextjs-v2`, built with `next build --webpack`
  (Turbopack fails on a dynamic JSON `import()` in `@zerobias-org/types-core-js`).
- **One build for all environments** — the client resolves its API host from
  `location.host` at runtime (origin-relative `/api`), so the same `dist/` is
  promoted across uat / qa / prod. No credentials are baked into the bundle.
- Deployed by `dispatch.yml` -> `static-s3-app-release`
  (`npm ci && npm run build`, then `aws s3 sync dist/` to
  `app-<env>-zerobias.com/example-nextjs-v2/`).

### v2 SDK signatures worth noting

- `CreateApiKeyBody(name, expiration?)`
- `upsertPrincipalKeyValue(pkv, principalId?)` — the `Pkv` comes first
- Client constructors require `ZerobiasClientOrgId` and `ZerobiasClientSessionId`
- Product fields are `code` / `imageUrl`; PKV type is `Pkv`
