# Client Bootstrap

How the v2 client is constructed and initialized. Source:
`src/lib/zerobias-app-service.ts`.

## The four objects

The 2.x constructors require an org-id service **and** a session-id service
(this changed from earlier versions — a `ZerobiasClientSessionId` is now
mandatory):

```ts
import {
  ZerobiasClientApi,
  ZerobiasClientApp,
  ZerobiasClientOrgId,
  ZerobiasClientSessionId,
  ZbEnvironment,
} from "@zerobias-com/zerobias-client";

const environment: ZbEnvironment = {
  production,             // false in local dev
  socketUrlPath: "/session",
  isLocalDev,
  localPortalOrigin,     // used for local-dev redirect targeting
};

const orgId = new ZerobiasClientOrgId();
const sessionId = new ZerobiasClientSessionId();
const api = new ZerobiasClientApi(orgId, sessionId, environment);
const app = new ZerobiasClientApp(api, orgId, sessionId, environment);

await app.init(requestInterceptor); // Promise<boolean>
```

Note: `ZbEnvironment` has **no `apiHostname`** — the client resolves the API
host from `location.host` at runtime. See
[environments-and-deploy.md](./environments-and-deploy.md).

## The request interceptor

`init()` takes an optional axios request interceptor. The only thing we use it
for is attaching the local-dev API key; in prod it's a no-op (the cookie carries
auth):

```ts
await app.init((req) => {
  if (env.isLocalDev && env.apiKey) {
    req.headers["Authorization"] = `APIKey ${env.apiKey}`;
  }
  return req;
});
```

## Browser-only + single init

The client touches `window`/`WebSocket`, so it must never run during
SSR/static-export prerender. Two rules enforce this:

1. `getZerobiasAppService()` throws if called with no `window`.
2. It's only ever called from a **client component effect**
   (`SessionProvider`), never at module top level or in a server component.

A module-level promise memoizes the service so `init()` runs exactly once, even
under React StrictMode's double-effect in dev:

```ts
let servicePromise: Promise<ZerobiasAppService> | null = null;
export function getZerobiasAppService() {
  if (typeof window === "undefined") throw new Error("browser-only");
  if (!servicePromise) servicePromise = ZerobiasAppService.create();
  return servicePromise;
}
```

## Accessing service clients

After init, reach any service via the api getters:
`api.portalClient`, `api.danaClient`, `api.hubClient`, `api.storeClient`,
`api.fileClient`, `api.graphqlClient`, … Each exposes typed `get*Api()` methods.
