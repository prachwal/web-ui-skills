# API Contracts

Patterns for typing, validating, and safely consuming API responses at the boundary.

## Zod validation at the ingress boundary

Never trust API responses. Validate with Zod before the data enters the app:

```ts
import { z } from "zod";

// Define the expected shape
const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  inStock: z.boolean(),
  category: z.enum(["electronics", "clothing", "food"]),
  tags: z.array(z.string()).default([]),
});

export type Product = z.infer<typeof ProductSchema>;

// Collection response with pagination
const ProductListResponseSchema = z.object({
  data: z.array(ProductSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
});

export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
```

## Typed fetch wrapper

A standalone fetch utility that validates the response shape and produces typed data:

```ts
import { ZodSchema, ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends Error {
  constructor(
    public readonly issues: ZodError["issues"],
    message = "API response did not match expected shape",
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function typedFetch<T>(
  url: string,
  schema: ZodSchema<T>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, `HTTP ${res.status}`, body);
  }

  const json = await res.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    // Log for debugging in development; never surface raw issues to users
    if (import.meta.env.DEV) {
      console.warn("API validation failed:", parsed.error.issues, json);
    }
    throw new ValidationError(parsed.error.issues);
  }

  return parsed.data;
}
```

Usage:

```ts
const products = await typedFetch(
  `/api/products?category=${categoryId}`,
  ProductListResponseSchema,
);
// products is fully typed as ProductListResponse
```

## Error envelope contract

Define a stable error shape for all API routes:

```ts
// Matches the server-side error response format
const ApiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  requestId: z.string().optional(),
  fields: z.record(z.array(z.string())).optional(), // for validation errors
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
```

Extract field-level validation errors from 422 responses:

```ts
export async function parseFieldErrors(res: Response): Promise<Record<string, string[]>> {
  const body = await res.json().catch(() => null);
  const parsed = ApiErrorResponseSchema.safeParse(body);
  if (parsed.success && parsed.data.fields) return parsed.data.fields;
  return {};
}
```

## Pagination contract

Consistent paginated request parameters:

```ts
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function buildPaginationQuery(params: PaginationParams): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("page", String(Math.max(1, params.page)));
  sp.set("pageSize", String(Math.min(100, Math.max(1, params.pageSize))));
  return sp;
}
```

## Rules

- Define schemas before writing fetch functions.
- One schema per API resource shape; reuse across routes.
- Distinguish `ApiError` (HTTP failure) from `ValidationError` (shape mismatch) in error handling.
- Do not silently coerce unknown shapes — fail explicitly in dev and log for investigation.
- Export the inferred TypeScript type alongside the Zod schema so components import the type directly.
- Keep schemas in `src/models/` or `src/contracts/`, not co-located with fetch utilities.
