---
name: netlify-typescript-api
description: Use when designing or implementing TypeScript backend APIs on Netlify, including handler structure, validation, typed contracts, error envelopes, and testable request/response flow.
---

# Netlify TypeScript API Skill

Use this skill when building a backend API in TypeScript for Netlify Functions or Netlify-compatible serverless routes after the execution primitive has already been chosen.

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

- The current handler shape is `export default async (req: Request, context: Context) => Response`.
- Use `context.params` for path params, `new URL(req.url)` for query params, and `Netlify.env.get()` for runtime env values.
- Execution-model choices belong in `netlify-serverless`.

## Implementation rules

- Use TypeScript end-to-end and avoid `any`.
- Treat `req.json()` as untrusted input and validate it before it reaches services.
- Validate all untrusted input at the edge.
- Return stable JSON envelopes for success and failure.
- Keep framework-specific code out of business logic.
- Prefer small composable helpers over large monolithic handlers.
- Return `Response` objects directly and use `Response.json()` for JSON payloads.
- Use `context.waitUntil()` only for truly non-blocking work such as audit logs or metrics emission.
- Keep secret policy and storage choice in the dedicated database skills.

## Reference files

### [`references/handler-patterns.md`](references/handler-patterns.md)
**Handler structure and method guards** — Canonical handler with method guard → auth → GET/POST branches, path params via `context.params`, `apiSuccess`/`apiError` response envelope helpers, safe `req.json()` with `.catch(() => null)`, `requireAuth()` JWT helper pattern, rules for validation order and request ID inclusion.

### [`references/contract-design.md`](references/contract-design.md)
**API contracts and versioning** — Typed `ApiSuccess<T>`/`ApiCollection<T>`/`ApiError` envelopes, `ok()`/`collection()`/`err()` builders with `satisfies`, error code constants, path-based versioning with `Deprecation`/`Sunset` headers, idempotency key pattern for retryable writes, security response headers.

### [`references/testing.md`](references/testing.md)
**Unit and integration testing** — Full vitest handler test with `Request` constructor (GET list, GET by ID, POST create, validation failure, malformed JSON, 401, 405), `vi.mock` of service and auth layers, `vitest.config.ts` for Node environment, `curl`-based `netlify dev` smoke tests, test coverage target table.

## External references

- Pair with [../netlify-serverless/SKILL.md](../netlify-serverless/SKILL.md) for execution-model choices.
- Pair with [../netlify-database-security/SKILL.md](../netlify-database-security/SKILL.md) when the handler touches persistent data.
- [Get started with functions](https://docs.netlify.com/functions/get-started/)
- [Serverless Functions API reference](https://docs.netlify.com/build/functions/api/)
- [Environment variables and functions](https://docs.netlify.com/functions/environment-variables/)
