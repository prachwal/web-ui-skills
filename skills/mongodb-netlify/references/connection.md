# MongoDB Connection Pattern

`MongoClient` reuse across warm invocations, Stable API options, pool sizing, and cold-start safety.

## Module-scope client with Stable API

```ts
// netlify/functions/_lib/db.ts
import { MongoClient, ServerApiVersion, type Db } from "mongodb";

// requireEnv throws at module init if the variable is missing,
// causing an immediate cold-start failure instead of a runtime null deref.
function requireEnv(name: string): string {
  const value = Netlify.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const uri = requireEnv("MONGODB_URI");

// Pool size explanation:
// - maxPoolSize: cap total connections per function instance (serverless = many small instances)
// - minPoolSize: 0 means no persistent connections held between invocations (saves Atlas connection quota)
// - maxConnecting: limit simultaneous connection setup attempts during bursts
// - serverSelectionTimeoutMS: fail fast if Atlas is unreachable rather than hanging the function
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,          // reject deprecated commands
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 0,
  maxConnecting: 2,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 10_000,
});

export async function getDb(name = "app"): Promise<Db> {
  // connect() is idempotent — safe to call on every warm invocation
  await client.connect();
  return client.db(name);
}
```

## Typed collection access

```ts
// src/models/product.ts
import type { ObjectId, WithId } from "mongodb";

export type Product = {
  name: string;
  price: number;
  slug: string;
  active: boolean;
  createdAt: Date;
};

// Use WithId<Product> for documents from the DB that include _id
export type ProductDoc = WithId<Product>;
```

```ts
// Usage in a service
import { getDb } from "../_lib/db";
import type { Product, ProductDoc } from "../../src/models/product";

export async function getActiveProducts(limit = 20): Promise<ProductDoc[]> {
  const db = await getDb();
  return db
    .collection<Product>("products")
    .find({ active: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .project<ProductDoc>({ name: 1, price: 1, slug: 1, createdAt: 1 })
    .toArray();
}
```

## Pool sizing guidance

| Scenario | `maxPoolSize` | `minPoolSize` |
|---|---|---|
| Low-traffic API | 5 | 0 |
| Moderate public API | 10 | 0 |
| High-concurrency (burst) | 10–20 | 0 |
| Background worker | 3 | 0 |

- Keep `minPoolSize: 0` in serverless to avoid holding idle Atlas connections across all function instances.
- Atlas M0 (free tier) has a hard connection limit — keep `maxPoolSize` at 5 or below.
- If connection exhaustion occurs under load, reduce `maxPoolSize` first before adding instances.

## Error handling

```ts
// Handle ObjectId parse errors (malformed IDs from client)
import { ObjectId, MongoServerError } from "mongodb";

function parseObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function getProductById(id: string) {
  const _id = parseObjectId(id);
  if (!_id) return null; // return 404 from handler, not 500

  const db = await getDb();
  return db.collection<Product>("products").findOne({ _id });
}
```

## Rules

- Initialize `MongoClient` at module scope, never inside the request handler.
- Call `client.connect()` before every `getDb()` call — it is idempotent and safe.
- Use the Stable API options to avoid silent breakage on Atlas server upgrades.
- Keep `minPoolSize: 0` and cap `maxPoolSize` to stay within Atlas connection limits.
- Validate and parse `ObjectId` values before queries — a parse failure is a 400/404, not a 500.
- Never log the connection URI — log the host portion only in diagnostics.
