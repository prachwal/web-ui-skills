# TypeScript runtime patterns

## Result type

```ts
type Ok<T> = { ok: true; value: T };
type Err<E = string> = { ok: false; error: E };
type Result<T, E = string> = Ok<T> | Err<E>;

const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
const err = <E = string>(error: E): Err<E> => ({ ok: false, error });
```

Usage:

```ts
async function createProduct(input: ProductInput): Promise<Result<Product>> {
  const parsed = ProductInput.safeParse(input);
  if (!parsed.success) return err("Validation failed");

  const existing = await repo.findByName(parsed.data.name);
  if (existing) return err("Product already exists");

  const product = await repo.save({ id: crypto.randomUUID(), ...parsed.data });
  return ok(product);
}

// Caller:
const result = await createProduct(body);
if (!result.ok) return Response.json({ error: result.error }, { status: 422 });
return Response.json({ data: result.value }, { status: 201 });
```

## Dependency injection pattern

Define ports as interfaces. Inject concrete implementations at composition root:

```ts
// src/ports/logger.ts
export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown): void;
}

// src/adapters/console-logger.ts
import type { Logger } from "../ports/logger";

export const consoleLogger: Logger = {
  info: (msg, ctx) => console.log(JSON.stringify({ level: "info", msg, ...ctx })),
  error: (msg, err) => console.error(JSON.stringify({ level: "error", msg, err })),
};

// src/services/product-service.ts
export class ProductService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly log: Logger,
  ) {}
}

// netlify/functions/api-products.ts (composition root)
import { consoleLogger } from "../../src/adapters/console-logger";
import { NeonProductRepository } from "../../src/adapters/neon-product-repo";
const service = new ProductService(new NeonProductRepository(), consoleLogger);
```

## Safe async wrapper

Avoid unhandled promise rejections by catching at the call site:

```ts
async function safe<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

const result = await safe(() => db.query(sql));
if (!result.ok) return fail("Database error", 500);
```

## Exhaustive switch

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

switch (status) {
  case "active": return "Active";
  case "archived": return "Archived";
  default: return assertNever(status); // compile error if a case is missing
}
```

## Testing patterns

Test public behavior; do not expose internals for testability:

```ts
// Pass Request/Response directly — no mocking framework needed for pure handlers
it("returns 422 on invalid price", async () => {
  const req = new Request("http://localhost/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Widget", price: -1 }),
  });
  const res = await handler(req, mockContext());
  expect(res.status).toBe(422);
  const body = await res.json();
  expect(body.error).toMatch(/validation/i);
});

function mockContext(overrides: Partial<Context> = {}): Context {
  return { requestId: "test-id", params: {}, ...overrides } as Context;
}
```

Test the service layer with mock adapters, not integration tests for every unit:

```ts
const mockRepo: ProductRepository = {
  findById: vi.fn().mockResolvedValue(null),
  save: vi.fn(),
};
const service = new ProductService(mockRepo, noopLogger);
```

## Module boundaries

- Never import from `netlify/functions/` inside `src/`.
- `src/models/` must not import from `src/services/` or `src/adapters/`.
- `src/services/` depends only on interfaces (`src/ports/`), not on adapters.
- `src/adapters/` implements ports and may import drivers (`pg`, `mongodb`, etc.).
- Test files may import from any layer but must not be imported by production code.

## Path aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Use `@/models/product` instead of `../../models/product`. Keep the alias shallow — one alias for `src/` is enough for most projects.
