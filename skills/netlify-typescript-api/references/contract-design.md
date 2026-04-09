# API Contract Design

Success and error envelopes, versioning, pagination, idempotency, and response header conventions.

## Standard envelopes

Use the same envelope shape across all routes in an API family.

```ts
// Success — single resource
{ "data": { "id": "p_123", "name": "Widget", "price": 4999 } }

// Success — collection
{
  "data": [ { "id": "p_123", "name": "Widget" } ],
  "meta": { "page": 1, "pageSize": 20, "total": 142 }
}

// Success — mutation confirmation
{ "data": { "id": "p_123" }, "meta": { "created": true } }

// Error
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "requestId": "req_abc123",
  "details": { "fieldErrors": { "price": ["Must be positive"] } }
}
```

## TypeScript types for envelopes

```ts
// src/lib/contracts.ts
export type ApiSuccess<T> = { data: T };
export type ApiCollection<T> = { data: T[]; meta: PaginationMeta };
export type ApiError = { error: string; code: string; requestId?: string; details?: unknown };

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

// Typed response builders
export function ok<T>(data: T): Response {
  return Response.json({ data } satisfies ApiSuccess<T>);
}

export function collection<T>(data: T[], meta: PaginationMeta): Response {
  return Response.json({ data, meta } satisfies ApiCollection<T>);
}

export function err(status: number, message: string, code: string, requestId?: string): Response {
  return Response.json({ error: message, code, requestId } satisfies ApiError, { status });
}
```

## Error code constants

```ts
// src/lib/error-codes.ts — use string constants, not magic numbers
export const E = {
  VALIDATION: "VALIDATION_ERROR",
  NOT_FOUND:  "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  INTERNAL: "INTERNAL_ERROR",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
} as const;
```

## Versioning strategy

```ts
// Path-based versioning — simple, explicit, easy to deprecate
export const config: Config = { path: "/api/v1/products" };
export const config: Config = { path: "/api/v1/products/:id" };

// When a breaking change is needed:
// 1. Deploy /api/v2/products alongside v1
// 2. Migrate clients
// 3. Add Sunset header to v1
// 4. Remove v1 after the deprecation period
return new Response(body, {
  headers: {
    "Deprecation": "true",
    "Sunset": "Sat, 31 Dec 2025 23:59:59 GMT",
    "Link": '</api/v2/products>; rel="successor-version"',
  },
});
```

## Idempotency keys

```ts
// POST /api/orders — client sends Idempotency-Key for safe retries
export default async (req: Request, context: Context) => {
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.length > 64) {
    return err(400, "Idempotency-Key header required", E.VALIDATION);
  }

  // Check if this key was already processed
  const existing = await lookupIdempotencyKey(idempotencyKey);
  if (existing) {
    return ok(existing); // return the original result, not a duplicate
  }

  const order = await createOrder(parsed.data);
  await saveIdempotencyKey(idempotencyKey, order); // TTL: 24h
  return ok(order);
};
```

## Security response headers

```ts
// Add to all JSON API responses
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Type": "application/json",
};

// Or via netlify.toml headers for all /api/* routes
```

## Rules

- Use `{ data }` for success, `{ error, code, requestId }` for failure — consistently.
- Include `requestId` in every error response — `context.requestId` or `crypto.randomUUID()`.
- Version in paths; do not use `Accept` headers for versioning unless the API is public and must follow REST negotiation conventions.
- Always bound pagination: validate `page` and `pageSize` and return `meta.total`.
- Use idempotency keys on any write endpoint that may be retried (orders, payments, sends).
- Add `Deprecation` and `Sunset` headers before removing a versioned route.
