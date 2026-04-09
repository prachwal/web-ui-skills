# Netlify Blobs — Security and Consistency Facts

Platform-level security properties, consistency model, and safe access patterns for Netlify Blobs.

## What Netlify guarantees (platform layer)

| Property | Status |
|---|---|
| Encryption at rest | ✅ All Blob data is encrypted at rest |
| Encryption in transit | ✅ HTTPS-only access |
| Global availability | ✅ New objects available globally immediately |
| Update/delete propagation | ⏱ Within ~60 seconds globally (eventual) |
| Local dev isolation | ✅ `netlify dev` uses a sandboxed local store, not production |
| Cross-site isolation | ✅ Blobs are scoped to the site; other sites cannot access them |

## What application code still controls

Netlify encrypting the data does not replace application-level access control. Your code is responsible for:

- Ensuring only authorized users can read or write specific keys.
- Not exposing arbitrary key access (e.g., user-supplied key names without validation).
- Choosing key naming conventions that prevent collision or guessing.

## Consistency model implications

```ts
// Safe: reading back the value after writing is not guaranteed to reflect the write immediately
// across regions during the propagation window.
await store.set("config/feature-flags", JSON.stringify(flags));

// If you immediately read back and serve to other regions:
const current = await store.get("config/feature-flags"); // may return the old value for ~60s
```

**Avoid**:
- Using Blobs as a lock or mutex — last write wins, no atomic compare-and-swap.
- Modeling sequences or counters in Blobs — no atomic increment.
- Relying on immediate global consistency after a write. If consistency is critical, use a DB.

## Safe key naming

```ts
// Bad — user-supplied key enables path traversal or key pollution
const key = req.headers.get("x-doc-id"); // untrusted
await store.get(key!);

// Good — validate and namespace
const docId = z.string().uuid().parse(req.headers.get("x-doc-id"));
const key = `docs/${docId}`; // namespaced, validated type
await store.get(key);

// Useful namespacing conventions:
// "user:{userId}/preferences"
// "cache:{resourceType}:{id}"
// "rendered:{slug}"
```

## Sensitive data in Blobs

```ts
// Do not store unencrypted sensitive user data in Blobs,
// even though Netlify encrypts at rest — application-level breach
// would expose the raw values.

// Acceptable: rendered HTML, JSON config, generated assets, public media
// Not acceptable: passwords, tokens, full credit card data, health records

// If you must store sensitive data, encrypt at the application layer before storing:
import { encryptForStorage, decryptFromStorage } from "../lib/encryption";

await store.set(`user:${userId}/secret`, await encryptForStorage(secret));
const raw = await store.get(`user:${userId}/secret`);
const secret = raw ? await decryptFromStorage(raw) : null;
```

## Access control in API handlers

```ts
// Gate Blob access behind authentication
export default async (req: Request, context: Context) => {
  const session = await verifySession(req);
  if (!session) return new Response(null, { status: 401 });

  // Scope the key to the authenticated user — never allow cross-user reads
  const store = getStore("user-data");
  const data = await store.get(`user:${session.userId}/preferences`, { type: "json" });

  return Response.json({ data: data ?? {} });
};
```

## Rules

- Validate and namespace all Blob keys — never use raw user input as a key.
- Treat Blobs as eventually consistent — do not read back a write and rely on the new value being visible immediately across all regions.
- Do not model concurrency-sensitive workflows (locks, counters, queues) on Blobs.
- Gate Blob access with authentication checks in the handler before calling `store.get`.
- Do not store unencrypted secrets, tokens, or sensitive PII in Blobs.
- Keep sensitive data in a transactional database, not Blobs.
