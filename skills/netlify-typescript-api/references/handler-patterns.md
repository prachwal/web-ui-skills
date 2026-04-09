# Handler Patterns

Route handler structure, method guards, path params, authentication, and error normalization for Netlify TypeScript APIs.

## Canonical handler shape

```ts
// netlify/functions/products.ts
import type { Config, Context } from "@netlify/functions";
import { createProduct, getProducts } from "../../src/services/products";
import { productInputSchema, productFilterSchema } from "../../src/models/product";
import { requireAuth } from "../../src/lib/auth";
import { apiError, apiSuccess } from "../../src/lib/response";

export default async (req: Request, context: Context) => {
  // 1. Method guard
  if (req.method !== "GET" && req.method !== "POST") {
    return apiError(405, "Method Not Allowed");
  }

  // 2. Authentication
  const session = await requireAuth(req);
  if (!session) return apiError(401, "Unauthorized");

  // 3. GET — list
  if (req.method === "GET") {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const parsed = productFilterSchema.safeParse(params);
    if (!parsed.success) return apiError(400, "Invalid query parameters");

    const products = await getProducts(parsed.data, session.orgId);
    return apiSuccess(products);
  }

  // 4. POST — create
  const body = await req.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) return apiError(422, "Validation failed", parsed.error.flatten());

  const product = await createProduct(parsed.data, session.orgId);
  return apiSuccess(product, 201);
};

export const config: Config = { path: "/api/products" };
```

## Path params with `context.params`

```ts
// netlify/functions/product-by-id.ts
export default async (req: Request, context: Context) => {
  const { id } = context.params; // from config path param

  if (!/^[a-z0-9-]{1,64}$/.test(id)) {
    return apiError(400, "Invalid product ID format");
  }

  const product = await getProductById(id);
  if (!product) return apiError(404, "Product not found");

  return apiSuccess(product);
};

export const config: Config = { path: "/api/products/:id" };
```

## Response envelope helpers

```ts
// src/lib/response.ts
export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

export function apiError(status: number, message: string, details?: unknown): Response {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  return Response.json(body, { status });
}
```

## Parsing body safely

```ts
// Never call req.json() without a catch — malformed JSON throws
const body = await req.json().catch(() => null);
if (!body || typeof body !== "object" || Array.isArray(body)) {
  return apiError(400, "Expected a JSON object body");
}
```

## Authentication helper pattern

```ts
// src/lib/auth.ts
export type Session = { userId: string; orgId: string; role: string };

export async function requireAuth(req: Request): Promise<Session | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  try {
    return await verifyJwt(token); // throws on invalid/expired
  } catch {
    return null;
  }
}
```

## Rules

- Always guard method at the top before any parsing or DB access.
- Use `context.params` for path params; do not manually parse `URL.pathname`.
- Validate all request inputs (query, body, headers) before reaching services.
- Return a consistent envelope: `{ data }` for success, `{ error }` for failure.
- `req.json()` must always be wrapped in `.catch(() => null)` — malformed JSON is a normal input.
- Include `requestId` in error responses for prod debugging (`context.requestId`).
