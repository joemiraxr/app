# Environments & Deploy

## One build for uat / qa / prod

The client resolves the API host from `location.host` at **runtime** — it calls
same-origin `/api/...`. So the **same static build** works on every env:

| Env | Branch | Served at | API it talks to |
|---|---|---|---|
| prod | `main` | `app.zerobias.com/example-nextjs-v2/` | `app.zerobias.com/api` |
| uat  | `uat`  | `uat.zerobias.com/example-nextjs-v2/` | `uat.zerobias.com/api` |
| qa   | `qa`   | `qa.zerobias.com/example-nextjs-v2/`  | `qa.zerobias.com/api` |

There is **no per-env API hostname baked into the build**, and no `cp`-based
config swapping. One artifact is promoted across all three.

## Config

`next.config.ts` is a single file with two modes, chosen by
`NEXT_PUBLIC_IS_LOCAL_DEV`:

- **Local dev** (`true`): `next dev` runs a server; `/api/*` is proxied to
  `NEXT_PUBLIC_DEV_API_ORIGIN`. No static export.
- **Build** (`false`, from `.env.production`): `output: "export"` →
  `dist/`, `basePath: /example-nextjs-v2`.

`.env.production` (committed, no secrets) holds `NEXT_PUBLIC_IS_LOCAL_DEV=false`
and `NEXT_PUBLIC_BASE_PATH`. Local secrets live in `.env.development` (git-ignored).

## Registries & tokens

`.npmrc` points both `@zerobias-com` and `@zerobias-org` at `pkg.zerobias.org`
(which proxies GitHub Packages for the `-com` scope). A single `ZB_TOKEN`
authenticates both — matching what CI provides.

## CI / deploy pipeline

`.github/workflows/dispatch.yml` fires on push to `main`/`uat`/`qa` and, for any
changed `package/*/*/**` app, dispatches `deploy.yml`, which runs the
`static-s3-app-release` action:

```
.nvmrc  ->  npm ci  ->  npm run build  ->  aws s3 sync dist/ s3://app-<env>-zerobias.com/<pkg-name>/
```

Requirements this repo satisfies:
- `.nvmrc` = 22 (client engine requirement).
- Committed `package-lock.json` (for `npm ci`).
- `npm run build` outputs to `dist/`.
- `ZB_TOKEN` is the only registry secret needed.

## Bundler note

`npm run build` uses **`next build --webpack`**, not Turbopack. Turbopack
statically fails on a dynamic JSON `import()` inside
`@zerobias-org/types-core-js`; webpack tolerates it (the code path is
lazily-invoked). Revisit once that package ships a Turbopack-safe build.
