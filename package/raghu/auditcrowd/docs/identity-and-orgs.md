# Identity & Organizations

Who the user is, which org is active, and how to switch. Sources:
`src/context/session-context.tsx`, `src/components/OrgSwitcher.tsx`.

## Reactive session state (RxJS)

The client exposes the current user and org as **RxJS Observables** backed by
`BehaviorSubject`s — subscribe to them, don't poll:

```ts
app.getWhoAmI(): Observable<WhoAmI | undefined>
app.getCurrentOrg(): Observable<Org | undefined>
app.getOrgs(): Observable<Org[]>
```

### Always unsubscribe

The single most important pattern here — and the one the pre-v2 demo got wrong.
Subscribe in an effect and tear down on unmount:

```ts
useEffect(() => {
  const subs: Subscription[] = [];
  getZerobiasAppService().then((service) => {
    subs.push(service.app.getWhoAmI().subscribe(setUser));
    subs.push(service.app.getCurrentOrg().subscribe(setOrg));
  });
  return () => subs.forEach((s) => s.unsubscribe());   // <-- required
}, []);
```

Leaking these subscriptions causes setState-after-unmount warnings and memory
growth as pages mount/unmount.

## Types come from the SDK

Don't hand-roll user/org shapes. Import them:

```ts
import type { Org, WhoAmI } from "@zerobias-com/dana-sdk";
```

`WhoAmI` has `id`, `name`, `emails`, `email?`, `avatarUrl?`, `isAdmin`, etc.
`Org` has `id`, `name`, `slug`, and the rest of the org record.

## Listing & switching orgs

- **List** the orgs the principal belongs to:
  ```ts
  const page = await api.danaClient.getOrgApi().listOrgs(1, 50); // PagedResults<Org>
  ```
- **Switch** the active org — this updates the client's current-org stream, so
  anything reading `getCurrentOrg()` (i.e. the whole app via context) re-renders:
  ```ts
  await app.selectOrg(org); // Promise<void>
  ```

`OrgSwitcher` lists with `listOrgs`, renders a `<select>`, and calls `selectOrg`
on change. Feature pages that are org-scoped (e.g. Products) re-query when
`org.id` changes.

## Sign out

```ts
app.onLogout();
```
