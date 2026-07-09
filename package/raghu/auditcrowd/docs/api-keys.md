# API Keys (write returning a one-time secret)

Mint a new API key. Source: `src/components/CreateApiKeyDialog.tsx`, opened from
the user menu (there is no standalone route — it matches the portal, where key
creation lives in the account dropdown).

## The call

```ts
import { CreateApiKeyBody, ApiKeyWithData } from "@zerobias-com/dana-sdk";
import { DateTime } from "@zerobias-org/types-core-js";

const body = new CreateApiKeyBody(name, new DateTime(expirationDate)); // expiration optional
const created = await api.danaClient.getMeApi().createApiKey(body);    // ApiKeyWithData
```

The SDK also exposes `getMeApi().listApiKeys()` (returns `ApiKey[]`, no secrets);
this demo only shows creation.

## The one-time secret

`createApiKey` returns `ApiKeyWithData`, whose **`data`** field is the actual
secret token. It is returned **only at creation time** and cannot be retrieved
later — surface it immediately for the user to copy.

```ts
created.data; // the secret — show once, never persisted by the platform
```

The dialog shows the secret (and the current Organization ID) in read-only
fields with copy buttons, and copies the secret to the clipboard on success.

## Building the request body

`CreateApiKeyBody(name, expiration?)`. `expiration` is a `DateTime` from
`@zerobias-org/types-core-js`. The form takes a duration + unit
(hours / days / years) and converts it to an absolute date:

```ts
function expirationFrom(duration: number, unit: "hours" | "days" | "years"): Date {
  const d = new Date();
  if (unit === "hours") d.setHours(d.getHours() + duration);
  else if (unit === "days") d.setDate(d.getDate() + duration);
  else d.setFullYear(d.getFullYear() + duration);
  return d;
}

const body = new CreateApiKeyBody(name, new DateTime(expirationFrom(30, "days")));
```

## Patterns shown

- Construct request bodies as SDK model instances (`new CreateApiKeyBody(...)`).
- Handle "returned-once" secrets in the UI (show in a read-only field with a
  copy button; never refetch or persist).
