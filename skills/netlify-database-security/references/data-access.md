# Safe Data Access Patterns

Parameterized queries, input validation, projection, and least-privilege patterns for Netlify APIs.

## Parameterized queries (SQL)

```ts
// Bad — string interpolation creates SQL injection risk
const slug = req.url.searchParams.get("slug");
const result = await db.query(`SELECT * FROM products WHERE slug = '${slug}'`);

// Good — parameterized
const slug = new URL(req.url).searchParams.get("slug") ?? "";
const result = await db.query(
  "SELECT id, name, price, description FROM products WHERE slug = $1 AND active = true",
  [slug],
);
```

## Input validation before query

```ts
import { z } from "zod";

const ProductFilterSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["name", "price", "created_at"]).default("created_at"),
});

export default async (req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = ProductFilterSchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { categoryId, page, pageSize, sort } = parsed.data;
  // safe to use in query — all values are validated and typed
  const products = await getProductsByCategory({ categoryId, page, pageSize, sort });
  return Response.json({ data: products });
};
```

## Least-privilege role setup (PostgreSQL)

```sql
-- Create a read-only role for reporting or read-heavy endpoints
CREATE ROLE app_read_only LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE app TO app_read_only;
GRANT USAGE ON SCHEMA public TO app_read_only;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read_only;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_read_only;

-- Create a limited write role for the API
CREATE ROLE app_api LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE app TO app_api;
GRANT USAGE ON SCHEMA public TO app_api;
GRANT SELECT, INSERT, UPDATE ON products, orders, users TO app_api;
-- No DROP, TRUNCATE, DELETE on sensitive audit tables
```

## Projection — return only needed fields

```ts
// Bad — leaks internal fields (is_admin, password_hash, internal_notes)
const user = await db.users.findOne({ id: userId });
return Response.json({ data: user });

// Good — explicit projection
const user = await db.users.findOne(
  { id: userId },
  {
    projection: {
      id: 1, name: 1, email: 1, createdAt: 1,
      // Explicitly exclude sensitive fields
      passwordHash: 0, isAdmin: 0, internalNotes: 0,
    },
  }
);
return Response.json({ data: user });
```

## Log redaction

```ts
const SENSITIVE_KEYS = new Set([
  "password", "passwordHash", "token", "accessToken", "refreshToken",
  "secret", "apiKey", "authorization", "ssn", "creditCard",
]);

function redactForLog(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((v) => redactForLog(v, depth + 1));

  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k.toLowerCase()) ? "[redacted]" : redactForLog(v, depth + 1),
    ]),
  );
}

// Usage before logging:
console.log(JSON.stringify({ event: "user.update", data: redactForLog(payload) }));
```

## Rules

- Every SQL value must go through a parameter placeholder (`$1`, `?`, `:name`) — never interpolate.
- Validate all external input with a schema before it reaches the database layer.
- Use allowlists for sort columns, filter fields, and operators — never pass user input verbatim as a column name.
- Apply projection to exclude fields the client does not need, especially on user records.
- Use separate DB roles for read-only and read-write paths when the schema has sensitive tables.
- Redact sensitive fields before logging request payloads or error contexts.
