# Serverless patterns

## Shared response helpers

Define once, import everywhere:

```ts
// netlify/functions/_lib/response.ts
export function ok(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function fail(message: string, status: number, requestId?: string) {
  return Response.json({ error: message, requestId }, { status });
}

export function noContent() {
  return new Response(null, { status: 204 });
}
```

## Shared error handler wrapper

```ts
// netlify/functions/_lib/handler.ts
import { fail } from './response';

type Handler = (req: Request, context: unknown) => Promise<Response>;

export function withErrorHandler(fn: Handler): Handler {
  return async (req, context) => {
    try {
      return await fn(req, context);
    } catch (err: unknown) {
      if ((err as Error).name === 'ValidationError') {
        return fail((err as Error).message, 422);
      }
      console.error('[function-error]', err);
      return fail('Internal server error', 500);
    }
  };
}
```

Usage:

```ts
import { withErrorHandler } from './_lib/handler';
export default withErrorHandler(async (req) => { … });
```

## Database connection (module-scope caching)

Netlify function instances are reused across warm invocations. Cache connections at module scope:

```ts
// netlify/functions/_lib/db.ts
import { Pool } from 'pg';

const uri = Netlify.env.get("DATABASE_URL");
if (!uri) throw new Error("DATABASE_URL is not set");

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: uri, max: 3 });
  }
  return pool;
}
```

Use `max: 3` or fewer per function to respect Postgres connection limits under concurrent invocations.

## Pagination pattern

```ts
interface PageParams { page: number; limit: number; }

function parsePagination(req: Request): PageParams {
  const qs = new URL(req.url).searchParams;
  const page  = Math.max(1, parseInt(qs.get("page")  ?? "1",  10));
  const limit = Math.min(100, Math.max(1, parseInt(qs.get("limit") ?? "20", 10)));
  return { page, limit };
}

function pagedResponse<T>(items: T[], total: number, { page, limit }: PageParams) {
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}
```

## Caching static GET responses

```ts
return new Response(JSON.stringify(data), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    // CDN caches for 60s, serves stale up to 300s while revalidating
  },
});
```

Use `no-store` for authenticated or user-specific responses.

## Testing serverless functions locally

```ts
// __tests__/api-products.test.ts
import handler from '../netlify/functions/api-products';

function mockRequest(method = "GET", body?: unknown, path = "/api/products"): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

it('returns 405 for non-GET requests', async () => {
  const res = await handler(mockRequest("DELETE"), {} as any);
  expect(res.status).toBe(405);
});

it('returns products list', async () => {
  const res = await handler(mockRequest("GET"), {} as any);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toHaveProperty('items');
});
```

## Netlify Blobs (key-value store)

```ts
import { getStore } from '@netlify/blobs';

const store = getStore('session-cache');

// write
await store.set(userId, JSON.stringify(sessionData), { ttl: 3600 });

// read
const raw = await store.get(userId);
const session = raw ? JSON.parse(raw) : null;
```

Use Netlify Blobs for ephemeral caching, rate-limit counters, or session tokens without a dedicated DB.

## Background function — fire and forget from UI

```ts
// Client call:
await fetch('/.netlify/functions/generate-report-background', {
  method: 'POST',
  body: JSON.stringify({ reportId }),
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
});
// Returns 202 immediately; poll a status endpoint or use webhooks for completion
```

## Performance checklist

- [ ] Heavy `import`s moved to async `import()` inside handler when rarely needed
- [ ] DB / Redis connections cached at module scope
- [ ] Read-only GET responses set `Cache-Control` with appropriate `s-maxage`
- [ ] Response bodies kept small; paginate large datasets
- [ ] Edge Functions used for auth checks, redirects, and geo logic instead of origin functions
- [ ] Scheduled functions used for batch jobs instead of blocking API calls
