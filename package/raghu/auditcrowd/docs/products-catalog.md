# Products Catalog (canonical read)

The simplest "call an SDK and render results" example. Source:
`src/app/products/page.tsx`.

## The call

```ts
import type { ProductExtended } from "@zerobias-com/portal-sdk";

const results = await api.portalClient
  .getProductApi()
  .search(searchBody, pageNumber, pageSize, sort?, pageToken?);
// results: PagedResults<ProductExtended>
const products = results.items;
```

- `searchBody` is a `SearchProductBody` — all fields optional. Pass `{}` for
  everything, or filter: `{ search: "github" }`, `{ code: "github.github" }`,
  `{ name, vendor, statuses, ... }`.
- `pageNumber` is **1-based**; `pageSize` caps the page.
- Returns `PagedResults<T>` — use `.items`, and `.pageToken` for token-based
  paging if you prefer it to page numbers.

## Field names (v2)

`ProductExtended` uses **`code`** and **`imageUrl`** — not the pre-v2
`packageCode` / `logo`. Key fields: `id`, `name`, `code`, `description?`,
`imageUrl?`, `status`, `semver`, `latestVersion`.

## Patterns shown

- Loading / empty / error states around every call.
- Pagination via Prev/Next (`pageNumber` state); Next disabled when the page
  returns fewer than `pageSize` rows.
- Org-scoped reload: the effect depends on `org?.id`, so switching org re-queries.
- `PagedResults<T>` is a class — read `.items`, don't index it directly.
