# example-nextjs-v2

Canonical example of building a custom app on the **ZeroBias platform** with the
**v2 client + SDKs** (`@zerobias-com/zerobias-client`). Next.js (App Router),
statically exported for S3/CloudFront.

> **Agents / contributors:** read **[AGENTS.md](./AGENTS.md)** first, then the
> per-feature reference in **[docs/](./docs/)**. What changed per version (and the
> SDK calls/patterns each version introduces): **[CHANGELOG.md](./CHANGELOG.md)**.

## Phase 1 features

| Feature | Route | Canonical SDK call |
|---|---|---|
| Auth gate (platform login redirect) | — | `app.init()` → auto `redirectLogin()` |
| Identity + org switch | header | `getWhoAmI()`, `getOrgApi().listOrgs()`, `selectOrg()` |
| Products catalog (read) | `/products` | `portalClient.getProductApi().search()` |
| Principal Key-Value (read + write) | `/pkv` | `danaClient.getPkvApi().upsertPrincipalKeyValue()` |
| API key (create) | user menu | `danaClient.getMeApi().createApiKey()` |

## Quick start (local dev)

```bash
# 1. Auth npm to the ZeroBias registry (get a ZB_TOKEN from the platform).
export ZB_TOKEN='<platform api key>'

# 2. Local env — set NEXT_PUBLIC_API_KEY to a key from the platform env you target.
cp .env.example .env.development

# 3. Install + run.
npm install
npm run dev        # http://localhost:3000
```

### Recommended: download the Next.js docs for your AI assistant

The local Next.js docs are **not committed** (git-ignored), so after cloning,
run this once to download the docs matching your exact Next.js version:

```bash
npx @next/codemod@latest agents-md   # auto-detects your Next version
```

It downloads the docs to `.next-docs/` and refreshes the index in
[`AGENTS.md`](./AGENTS.md). If you're building with an AI coding assistant
(Claude Code, Cursor, Copilot, …), this makes it noticeably more accurate — it
reads version-exact docs instead of guessing from training data. Re-run it
whenever you change the `next` version. See AGENTS.md for details.

## Build (production deliverable)

```bash
npm run build      # -> dist/  (static export, basePath /example-nextjs-v2)
npm run preview    # serve dist/ locally
```

The same `dist/` is promoted to uat / qa / prod — the client targets its own
origin's `/api` at runtime. See [docs/environments-and-deploy.md](./docs/environments-and-deploy.md).

## Test / lint / typecheck

```bash
npm test           # Vitest (unit tests)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Requirements

- Node >= 22 (client engine requirement; see `.nvmrc`).
- A ZeroBias platform account + API key.

## Roadmap

- **Phase 2:** GitHub module chain, shared-session key, Data Explorer.
- **Phase 2/3:** FileService example.
