# Serverless patterns

## Shared response helpers

Define once, import everywhere:

```ts
// netlify/functions/_lib/response.ts
type Headers = Record<string, string>;

const JSON_CT: Headers = { 'Content-Type': 'application/json' };

export function ok(data: unknown, status = 200, extra: Headers = {}) {
  return { statusCode: status, headers: { ...JSON_CT, ...extra }, body: JSON.stringify(data) };
}

export function fail(message: string, status: number, extra: Headers = {}) {
  return { statusCode: status, headers: { ...JSON_CT, ...extra }, body: JSON.stringify({ error: message }) };
}

export function noContent() {
  return { statusCode: 204, body: '' };
}
```

## Shared input validation error handler

```ts
// netlify/functions/_lib/handler.ts
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { fail } from './response';

export function withErrorHandler(fn: Handler): Handler {
  return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    try {
      return await fn(event, context) as HandlerResponse;
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
export const handler = withErrorHandler(async (event) => { … });
```

## Database connection (module-scope caching)

Netlify function instances are reused across warm invocations. Cache connections at module scope:

```ts
// netlify/functions/_lib/db.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  }
  return pool;
}
```

Use `max: 3` or fewer per function to respect Postgres connection limits under concurrent invocations.

## Pagination pattern

```ts
interface PageParams { page: number; limit: number; }

function parsePagination(qs: Record<string, string> | null): PageParams {
  const page  = Math.max(1, parseInt(qs?.page  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(qs?.limit ?? '20', 10)));
  return { page, limit };
}

function pagedResponse<T>(items: T[], total: number, { page, limit }: PageParams) {
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}
```

## Caching static GET responses

```ts
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    // CDN caches for 60s, serves stale up to 300s while revalidating
  },
  body: JSON.stringify(data),
};
```

Use `no-store` for authenticated or user-specific responses.

## Testing serverless functions locally

```ts
// __tests__/api-products.test.ts
import { handler } from '../netlify/functions/api-products';
import type { HandlerEvent } from '@netlify/functions';

function mockEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    httpMethod: 'GET',
    path: '/api/products',
    headers: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
    rawUrl: 'http://localhost/api/products',
    rawQuery: '',
    ...overrides,
  };
}

it('returns 405 for non-GET requests', async () => {
  const res = await handler(mockEvent({ httpMethod: 'DELETE' }), {} as any);
  expect(res?.statusCode).toBe(405);
});

it('returns products list', async () => {
  const res = await handler(mockEvent(), {} as any);
  expect(res?.statusCode).toBe(200);
  expect(JSON.parse(res?.body ?? '')).toHaveProperty('items');
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
