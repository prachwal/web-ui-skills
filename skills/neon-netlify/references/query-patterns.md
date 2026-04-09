# Neon Query Patterns

Parameterized SQL, EXPLAIN-driven optimization, index recommendations, and pagination.

## Safe parameterized queries (tagged template)

The `neon()` tagged-template driver automatically parameterizes values — they are never interpolated into the SQL string.

```ts
import { sql } from "./_lib/db";

// Values are escaped by the driver — safe against SQL injection
export async function getUserByEmail(email: string) {
  const rows = await sql`
    SELECT id, name, email, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// Multiple parameters
export async function searchProducts(categoryId: number, minPrice: number, limit: number) {
  return sql`
    SELECT id, name, price, slug
    FROM products
    WHERE category_id = ${categoryId}
      AND price >= ${minPrice}
      AND active = true
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}
```

## Bounded pagination

```ts
const MAX_PAGE_SIZE = 100;

export async function getPaginatedProducts(params: {
  page: number;
  pageSize: number;
}): Promise<{ rows: unknown[]; total: number }> {
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
  const offset = (Math.max(1, params.page) - 1) * pageSize;

  const [rows, countRows] = await Promise.all([
    sql`
      SELECT id, name, price, slug
      FROM products
      WHERE active = true
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    sql`SELECT COUNT(*)::int AS total FROM products WHERE active = true`,
  ]);

  return { rows, total: (countRows[0] as { total: number }).total };
}
```

## Using EXPLAIN to diagnose slow queries

```sql
-- Run in Neon SQL editor or psql against the direct connection string
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
  SELECT id, name, price
  FROM products
  WHERE category_id = 5 AND active = true
  ORDER BY created_at DESC
  LIMIT 20;
```

**What to look for:**

| Output | Meaning | Action |
|---|---|---|
| `Seq Scan` on large table | No usable index | Add index on filter columns |
| `Sort` with high estimated cost | Index does not cover the sort | Add index on `(filter_col, sort_col DESC)` |
| `Nested Loop` with millions of rows | Hot-path JOIN needs an index | Index the join column on the inner table |
| `Buffers: hit=X miss=Y` (high miss) | Data not in shared_buffers | Scale compute tier; add `LIMIT` |
| `rows=1000000` estimate / actual `rows=5` | Stale statistics | Run `ANALYZE table_name` |

## Index recommendations

```sql
-- Single-column filter index
CREATE INDEX idx_products_category_id ON products (category_id);

-- Compound index for filter + sort (order matters)
CREATE INDEX idx_products_cat_active_created
  ON products (category_id, active, created_at DESC);

-- Partial index for common predicate (smaller, faster)
CREATE INDEX idx_products_active_created
  ON products (created_at DESC)
  WHERE active = true;

-- Index for full-text search (Postgres built-in)
CREATE INDEX idx_products_name_fts
  ON products USING gin(to_tsvector('english', name));
```

## Upsert pattern (INSERT … ON CONFLICT)

```ts
// Idempotent write — safe to retry
export async function upsertUserPreferences(userId: string, preferences: Record<string, unknown>) {
  await sql`
    INSERT INTO user_preferences (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(preferences)}, now())
    ON CONFLICT (user_id)
    DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
  `;
}
```

## Rules

- Always use tagged-template parameters — never string-interpolate values into SQL.
- Cap page size with `Math.min(MAX_PAGE_SIZE, ...)` before using in `LIMIT`.
- Run `EXPLAIN ANALYZE` before and after adding an index — measure, do not guess.
- Add index incrementally; over-indexing slows writes and increases storage.
- Use `ON CONFLICT … DO UPDATE` for idempotent writes rather than check-then-insert.
- Run `ANALYZE table_name` after bulk inserts to refresh query planner statistics.
