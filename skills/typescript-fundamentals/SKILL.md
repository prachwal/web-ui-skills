---
name: typescript-fundamentals
description: Use when designing or reviewing TypeScript code structure, type safety, patterns, JSDoc, naming conventions, formatting, and module organization. Applies to both frontend and backend TypeScript projects.
---

# TypeScript Fundamentals Skill

Use this skill when writing, reviewing, or refactoring TypeScript code with a focus on correctness, readability, and maintainability.

## Core principles

1. Prefer explicit types at module boundaries; let the compiler infer inside function bodies.
2. Model the domain with types before writing logic.
3. Avoid `any`. Use `unknown` for truly unknown values and narrow at the boundary.
4. Keep types small and composable. Prefer intersection and union over large monolithic interfaces.
5. Write code that is easy to delete — avoid deep coupling through concrete classes, global state, or shared mutable singletons.
6. Fail fast: validate untrusted input at system entry points and return typed errors instead of throwing broadly.

## tsconfig baseline

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": false
  }
}
```

- Enable `strict` always. Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` for new projects.
- Use `verbatimModuleSyntax` to make import/export intent explicit and avoid commonjs interop surprises.
- Set `skipLibCheck: false` for strict projects; relax only when third-party type errors block builds.

## Type design

```ts
// Prefer discriminated unions for state machines
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

// Use branded types for IDs that must not be mixed
type UserId = string & { readonly _brand: "UserId" };
type ProductId = string & { readonly _brand: "ProductId" };

// Narrow exhaustively
function describe(state: RequestState<Product>): string {
  switch (state.status) {
    case "idle": return "idle";
    case "loading": return "loading";
    case "success": return state.data.name;
    case "error": return state.error;
  }
}
```

## Naming conventions

| Context | Convention | Example |
|---|---|---|
| Variables, functions | `camelCase` | `getUserById`, `pageLimit` |
| Types, interfaces, classes | `PascalCase` | `ProductInput`, `UserService` |
| Enums | `PascalCase` members | `Status.Active` |
| Constants (module-level) | `SCREAMING_SNAKE` for primitives | `MAX_PAGE_SIZE = 100` |
| Files | `kebab-case` | `user-service.ts`, `api-products.ts` |
| Private class members | `_prefix` only when disambiguation is needed; prefer `#private` | `#cache` |
| Boolean variables | `is`, `has`, `can`, `should` prefix | `isActive`, `hasPermission` |

- Do not abbreviate unless the abbreviation is domain-standard (`id`, `url`, `db`, `req`, `res`).
- Name functions with verbs: `fetchUser`, `createOrder`, `validateInput`.
- Name types with nouns: `User`, `OrderSummary`, `ValidationResult`.

## Patterns

### Result type instead of throwing

```ts
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parsePositiveInt(raw: string): Result<number> {
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 1) return { ok: false, error: `"${raw}" is not a positive integer` };
  return { ok: true, value: n };
}
```

### Validation with Zod

```ts
import { z } from "zod";

const ProductInput = z.object({
  name: z.string().min(1).max(200),
  price: z.number().nonnegative(),
  tags: z.array(z.string()).max(10).default([]),
});

type ProductInput = z.infer<typeof ProductInput>;

// At boundary:
const parsed = ProductInput.safeParse(await req.json());
if (!parsed.success) return Response.json({ error: "Validation failed" }, { status: 422 });
```

### Dependency injection without a framework

```ts
// Define ports as interfaces; inject at callsite
interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown): void;
}

interface ProductRepository {
  findById(id: ProductId): Promise<Product | null>;
  save(product: Product): Promise<void>;
}

class ProductService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly log: Logger,
  ) {}

  async getProduct(id: ProductId): Promise<Product | null> {
    const product = await this.repo.findById(id);
    this.log.info("product.get", { id, found: product !== null });
    return product;
  }
}
```

### Module organization

```
src/
  models/       ← pure types and domain schemas (no side effects)
  services/     ← business logic; depends on models and ports
  lib/          ← stateless helpers: parsing, formatting, errors
  adapters/     ← implementations of ports (DB, HTTP, storage)
  contracts/    ← API request/response types shared with callers
```

- Keep `models/` free of runtime dependencies.
- Do not import from parent directories (`../../..`). Use path aliases via `tsconfig.paths`.

## JSDoc

Add JSDoc only where the type system cannot capture intent — use cases, invariants, non-obvious behavior, and public API surface.

```ts
/**
 * Returns the paginated list of products matching the filter.
 *
 * @param filter - Only products where `active` matches are returned.
 *                 Omit to return all products.
 * @param page   - 1-based page number. Must be ≥ 1.
 * @param limit  - Items per page. Clamped to [1, 100].
 * @returns      Items for the requested page and total count for pagination UI.
 */
async function listProducts(
  filter: ProductFilter,
  page: number,
  limit: number,
): Promise<{ items: Product[]; total: number }> { … }
```

Rules:
- Document params only when the name and type are insufficient.
- Document `@throws` only for errors that callers must handle.
- Do not repeat what TypeScript already expresses (`@param name string name of the user` adds nothing).
- Use `@internal` to mark helpers not intended for external consumers.
- Use `@deprecated` with a migration path when retiring APIs.

## Formatting

Use Prettier with minimal overrides:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "singleQuote": false,
  "trailingComma": "all",
  "semi": true
}
```

- Double quotes are the TypeScript community default; single quotes are acceptable if consistent.
- Always include trailing commas in multi-line structures — reduces diff noise.
- Keep imports sorted: use `import type` for type-only imports (`verbatimModuleSyntax` enforces this).

## Import discipline

```ts
// Type-only import — required with verbatimModuleSyntax
import type { Config, Context } from "@netlify/functions";

// Group and order: external → internal → relative
import { z } from "zod";

import type { Product } from "@/models/product";
import { ProductService } from "@/services/product-service";

import { fail, ok } from "../lib/response";
```

- One import per module. Do not mix type and value imports unless the bundler requires it.
- Avoid re-exporting everything with barrel files in large modules — they hurt tree shaking and slow compilers.

## Code review checklist

- [ ] No `any`; unknown input narrowed at boundary
- [ ] Strict null checks respected; optional fields accessed safely
- [ ] No unused imports or variables
- [ ] Functions and types named with verbs/nouns consistently
- [ ] Domain logic in `services/`, transport in handlers, types in `models/`
- [ ] JSDoc present for exported public API
- [ ] `import type` used for type-only imports
- [ ] No runtime side effects at module scope except safe initialization

## References

Local reference files:
- [references/types.md](references/types.md): type design patterns, branded types, generics, utility types
- [references/patterns.md](references/patterns.md): Result type, dependency injection, module structure, testing patterns
- [references/jsdoc.md](references/jsdoc.md): JSDoc rules, tags reference, and examples

TypeScript docs:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [tsconfig reference](https://www.typescriptlang.org/tsconfig)
- [Zod documentation](https://zod.dev/)
- [Prettier configuration](https://prettier.io/docs/en/options.html)
