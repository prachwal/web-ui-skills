# Database Efficiency Patterns

Query optimization, N+1 prevention, and EXPLAIN-driven improvements for APIs on Netlify.

## Column projection — return only needed fields

```ts
// Bad — full document round-trip, large payload
const products = await db.query("SELECT * FROM products WHERE active = true");

// Good — project only what the API returns
const products = await db.query(`
  SELECT id, name, price, slug
  FROM products
  WHERE active = true
  ORDER BY name
  LIMIT $1 OFFSET $2
`, [pageSize, offset]);
```

## Bounded pagination

```ts
const MAX_PAGE_SIZE = 100;

function buildProductQuery(params: {
  page?: number;
  pageSize?: number;
  sort?: "name" | "price" | "created_at";
  order?: "asc" | "desc";
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  // Allowlist prevents SQL injection via sort/order params
  const allowedSorts = new Set(["name", "price", "created_at"]);
  const sort = allowedSorts.has(params.sort ?? "") ? params.sort : "created_at";
  const order = params.order === "asc" ? "ASC" : "DESC";

  return {
    sql: `SELECT id, name, price, slug FROM products WHERE active = true
          ORDER BY ${sort} ${order} LIMIT $1 OFFSET $2`,
    values: [pageSize, offset],
    meta: { page, pageSize, offset },
  };
}
```

## Avoiding N+1 queries

```ts
// Bad — N+1: one query per product to load its category
const products = await getProducts();
for (const p of products) {
  p.category = await getCategoryById(p.categoryId); // ← N extra queries
}

// Good — one JOIN or one bulk fetch
const products = await db.query(`
  SELECT p.id, p.name, p.price, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.active = true
  LIMIT $1
`, [pageSize]);

// Alternative for non-relational stores: bulk fetch + in-memory join
const productRows = await getProducts(ids);
const categoryIds = [...new Set(productRows.map((p) => p.categoryId))];
const categories = await getCategoriesByIds(categoryIds); // single query
const categoryMap = new Map(categories.map((c) => [c.id, c]));
const enriched = productRows.map((p) => ({ ...p, category: categoryMap.get(p.categoryId) }));
```

## Using EXPLAIN before optimizing

```sql
-- Run against your Neon, Postgres, or Atlas Analytics node
EXPLAIN (ANALYZE, BUFFERS)
  SELECT id, name, price
  FROM products
  WHERE category_id = 42 AND active = true
  ORDER BY created_at DESC
  LIMIT 20;
```

Look for:
- `Seq Scan` on large tables → add an index on the filter columns.
- `Sort` with `cost > 100ms` → add an index on the sort column.
- `Nested Loop` on millions of rows → rewrite as a single JOIN or CTE.
- `Buffers: hit=X miss=Y` — high miss ratio means the data is not cached in shared_buffers.

## Index strategy

```sql
-- Single column for common filter
CREATE INDEX idx_products_category_id ON products (category_id);

-- Compound index for filter + sort
CREATE INDEX idx_products_category_active_created
  ON products (category_id, active, created_at DESC);

-- Partial index for active-only queries (smaller, faster)
CREATE INDEX idx_products_active_created
  ON products (created_at DESC)
  WHERE active = true;
```

> Add indexes incrementally after measuring. Over-indexing slows writes.

## Rules

- Never unbounded-scan a large table — always add `LIMIT`.
- Index every column used in `WHERE`, `JOIN`, and `ORDER BY` on hot paths.
- Run `EXPLAIN ANALYZE` before claiming a query is slow and before claiming an index fixed it.
- Projection (SELECT only needed columns) is the cheapest optimization available.
- Avoid read-modify-write loops — prefer atomic DB operations (`UPDATE … RETURNING`, `ON CONFLICT … DO UPDATE`).
