# Neon Connection Pattern

Serverless-safe `neon()` setup, module-scope reuse, pooled vs. direct connections, and fail-fast initialization.

## Module-scope SQL executor

```ts
// netlify/functions/_lib/db.ts
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

function requireEnv(name: string): string {
  const value = Netlify.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Use the pooled connection string for Netlify Functions:
// Format: postgres://user:pass@ep-XXXX-pooler.region.aws.neon.tech/dbname?sslmode=require
const connectionString = requireEnv("DATABASE_URL");

// neon() returns a tagged-template SQL executor.
// Reusing at module scope avoids connection setup cost on each warm invocation.
export const sql: NeonQueryFunction<false, false> = neon(connectionString);
```

## Usage — parameterized tagged-template queries

```ts
// Parameters are escaped automatically by the driver — no manual sanitization needed
export async function getProductBySlug(slug: string) {
  const rows = await sql`
    SELECT id, name, price, slug, description
    FROM products
    WHERE slug = ${slug} AND active = true
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getProducts({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number }) {
  const offset = (page - 1) * pageSize;
  return sql`
    SELECT id, name, price, slug
    FROM products
    WHERE active = true
    ORDER BY created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;
}
```

## Pooled vs. direct connection string

| String type | When to use | Format |
|---|---|---|
| **Pooled** (`-pooler`) | Netlify Functions (high concurrency, short-lived) | `...ep-xxx-pooler.region.aws.neon.tech/db` |
| **Direct** | Migration tooling, long-running scripts, ORM introspection | `...ep-xxx.region.aws.neon.tech/db` |

> Always set `?sslmode=require` on both string types.

```bash
# Example (Netlify UI / .env.local)
DATABASE_URL=postgres://alex:secret@ep-abc123-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_DIRECT=postgres://alex:secret@ep-abc123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Transaction pattern (when needed)

Tagged-template API does not support transactions directly. Use `neonConfig` + the `pg` package for transactions, or use a query builder like Drizzle:

```ts
import { neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";

// Only use Pool for transaction flows — use neon() for simple queries
neonConfig.webSocketConstructor = undefined; // use native TCP in Node 18+
const pool = new Pool({ connectionString: requireEnv("DATABASE_URL_DIRECT") });

export async function transferCredits(fromId: string, toId: string, amount: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE accounts SET credits = credits - $1 WHERE id = $2", [amount, fromId]);
    await client.query("UPDATE accounts SET credits = credits + $1 WHERE id = $2", [amount, toId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
```

## Rules

- Use the pooled connection string for all Netlify Function read/write queries.
- Use the direct connection string only for migration tooling run outside of function runtime.
- Initialize `sql` at module scope — never inside the request handler.
- Set `?sslmode=require` on both connection strings.
- Use `requireEnv()` to fail closed at cold start if `DATABASE_URL` is missing.
- For transactions, use a separate `Pool` with the direct string, not the serverless driver.
