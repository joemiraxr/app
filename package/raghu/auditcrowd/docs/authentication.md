# Authentication & Session

**You do not build a login page.** The ZeroBias platform owns login; the v2
client drives the redirect for you.

## How it works

On `ZerobiasClientApp.init()` the client calls `whoAmI()`. If there is no valid
session **and** you are not in local-dev mode, the client automatically
redirects the browser to the platform login:

```
https://<host>/api/dana/me/session/login?nextPath=<this app URL>&cookieDomain=<host>
```

The user authenticates on the real platform and is redirected back to
`nextPath` (this app) with a **session cookie**. Every subsequent SDK request
carries that cookie. Session expiry is handled the same way (standalone → a
`session_expired.html` redirect; iframe → a `NOT_AUTHORIZED_REDIRECT`
`postMessage` to the portal parent).

## Three deployment modes

| Mode | How the session is obtained |
|---|---|
| Standalone on `uat`/`qa`/`app.zerobias.com` | Client auto-redirects to platform login, returns with a session cookie. Same `*.zerobias.com` domain as the portal, so a user already signed into the portal is authenticated transparently. |
| Embedded as an iframe in the portal | Inherits the portal session; coordinates via `postMessage`. |
| Local dev (`localhost`) | No redirect. An **API key** is attached as `Authorization: APIKey <key>` (see below). |

## Local dev

A browser on `localhost` can't share the platform's session cookie, so local dev
authenticates with an API key instead. In `.env.development`:

```
NEXT_PUBLIC_IS_LOCAL_DEV=true
NEXT_PUBLIC_API_KEY=<api key from the platform env you point at>
NEXT_PUBLIC_DEV_API_ORIGIN=https://app.zerobias.com
```

`next dev` proxies `/api/*` to `NEXT_PUBLIC_DEV_API_ORIGIN` (see `next.config.ts`),
and the app service attaches the API key via a request interceptor
(`src/lib/zerobias-app-service.ts`).

## In this app

- `src/components/AuthGate.tsx` shows a "Connecting…" screen until `whoAmI()`
  resolves, then renders the app. If there's no session in prod, the redirect
  has already fired, so the gate is only briefly visible.
- Never add a custom sign-in form. "Sign out" calls `app.onLogout()`.

See also: [client-bootstrap.md](./client-bootstrap.md).
