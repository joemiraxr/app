# Principal Key-Value (canonical read + write)

Per-principal key-value storage — a simple round-trip that shows both a read and
a mutation. Source: `src/app/pkv/page.tsx`.

## The calls

```ts
import { Pkv } from "@zerobias-com/dana-sdk";

// read (token-paginated)
const page = await api.danaClient
  .getPkvApi()
  .listPrincipalKeyValues(principalId?, pageToken?, pageSize?); // PagedResults<Pkv>

// write (create or update)
const saved = await api.danaClient
  .getPkvApi()
  .upsertPrincipalKeyValue(new Pkv(key, value), principalId?); // Pkv

// delete
await api.danaClient.getPkvApi().deletePrincipalKeyValue(key, principalId?);
```

## Signature gotcha (v2)

`upsertPrincipalKeyValue(pkv, principalId?)` takes the **`Pkv` first**. The
pre-v2 demo called it as `upsertPrincipalKeyValue(undefined, pkv)` — the
argument order was reversed in v2. Copying the old call site produces a
runtime error. Omit `principalId` to target the current principal.

## The `Pkv` shape

```ts
class Pkv {
  key: string;
  value: { [key: string]: object }; // a JSON object map, not an arbitrary scalar
  constructor(key: string, value: { [key: string]: object });
}
```

So the value must parse to an **object**. The demo `JSON.parse`s the textarea and
rejects non-JSON before calling upsert.

## Patterns shown

- Construct SDK model instances with `new Pkv(...)` rather than object literals,
  so the SDK serializes them correctly.
- Validate input (JSON parse) before the network call.
- Re-list after a successful write to reflect the new state.
