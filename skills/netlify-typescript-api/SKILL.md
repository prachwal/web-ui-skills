---
name: netlify-typescript-api
description: Use when designing or implementing TypeScript backend APIs on Netlify, including the current Functions API, routing with config.path, validation, typed contracts, and response design.
---

# Netlify TypeScript API Skill

Use this skill when building a backend API in TypeScript for Netlify Functions or Netlify-compatible serverless routes.

## Core goals

- Keep handlers small, deterministic, and easy to test.
- Separate transport concerns from business logic.
- Make request and response shapes explicit.
- Fail fast on invalid input and return consistent error payloads.
- Stay on the current Netlify Functions API instead of the older Lambda event object unless a legacy integration requires compatibility mode.

## Recommended structure

- `src/models/` for shared types, schemas, and domain rules.
- `src/services/` for database and external API adapters.
- `netlify/functions/` for the deployed function entrypoints.
- `src/lib/` for shared helpers such as parsing, errors, and logging.
- `src/contracts/` for route-level request and response types when the API surface is non-trivial.

## Platform facts that change implementation

- Netlify Functions support TypeScript without extra bundler setup. Netlify loads `tsconfig.json` from the functions directory, repo root, or base directory if present.
- The current handler shape is `export default async (req: Request, context: Context) => Response`.
- Use `export const config = { path: "/api/..." }` to attach routes directly instead of relying on redirect-only routing for every endpoint.
- Use `context.params` for path params, `new URL(req.url)` for query params, and `Netlify.env.get()` for runtime env values.

## Implementation rules

- Use TypeScript end-to-end and avoid `any`.
- Treat `req.json()` as untrusted input and validate it before it reaches services.
- Validate all untrusted input at the edge.
- Return stable JSON envelopes for success and failure.
- Keep framework-specific code out of business logic.
- Prefer small composable helpers over large monolithic handlers.
- Return `Response` objects directly and use `Response.json()` for JSON payloads.
- Use `context.waitUntil()` only for truly non-blocking work such as audit logs or metrics emission.

## Recommended route shape

```ts
import type { Config, Context } from "@netlify/functions";
import { createProduct } from "../../src/services/products";
import { productInputSchema } from "../../src/models/product";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const parsed = productInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 422 });
  }

  const product = await createProduct(parsed.data, context.requestId);
  return Response.json({ data: product }, { status: 201 });
};

export const config: Config = {
  path: "/api/products",
};
```

## Handler checklist

- Parse method, path, headers, query params, and body explicitly.
- Prefer `config.path` + `context.params` over manual path parsing.
- Validate authentication and authorization before data access.
- Normalize all errors into a known response format.
- Set content type, cache headers, and security headers intentionally.
- Keep side effects isolated so logic can be unit tested.
- Include a request identifier in logs and optionally in error payloads.

## Contract design

- Use one success envelope shape per API family, such as `{ data, meta }`.
- Use one error envelope shape per API family, such as `{ error, code, requestId }`.
- Version behavior in paths or route groups when breaking changes are possible.
- Keep pagination, filtering, and sorting explicit and bounded.
- Use idempotency keys for endpoints that create expensive side effects or may be retried by clients.

## Local and CI validation

- Test handlers as pure functions where possible by passing `Request` objects directly.
- Run route tests for invalid JSON, wrong methods, missing auth, validation failures, and downstream failures.
- Run at least one integration pass with `netlify dev` before publishing route changes that depend on platform behavior.

## Testing focus

- Happy path for each route.
- Invalid input and malformed JSON.
- Unauthorized and forbidden access.
- Downstream database or service failures.
- Boundary cases for pagination, filtering, and idempotency.

## References

- [Get started with functions](https://docs.netlify.com/functions/get-started/)
- [Serverless Functions API reference](https://docs.netlify.com/build/functions/api/)
- [Environment variables and functions](https://docs.netlify.com/functions/environment-variables/)
