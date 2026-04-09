# JSDoc reference

## When to use JSDoc

Add JSDoc to:
- Exported functions, classes, and types that form a public or shared API.
- Functions with non-obvious behavior, side effects, or invariants.
- Parameters where the name and type leave intent unclear.
- Deprecated code with a migration path.

Skip JSDoc for:
- Private helper functions that are simple and self-describing.
- Types where the structure is fully self-documenting.
- Parameters that are obvious from their name and type together.

## Basic function

```ts
/**
 * Creates a URL-safe slug from an arbitrary string.
 *
 * Lowercases, strips accents, replaces whitespace and
 * non-alphanumeric characters with hyphens, and collapses
 * consecutive hyphens.
 *
 * @example
 * slugify("Hello World!")   // "hello-world"
 * slugify("Łódź 2024")      // "lodz-2024"
 */
export function slugify(input: string): string { … }
```

## Parameters and return value

Only document params when the name or type is insufficient:

```ts
/**
 * Fetches the paginated product list.
 *
 * @param filter   - Restricts results. Pass `{}` to return all products.
 * @param page     - 1-based page index. Values below 1 are clamped to 1.
 * @param limit    - Items per page. Clamped to [1, 100].
 * @returns        Array of products and total count for pagination.
 */
async function listProducts(
  filter: ProductFilter,
  page: number,
  limit: number,
): Promise<{ items: Product[]; total: number }> { … }
```

## Throws

Document only errors that callers are expected to catch:

```ts
/**
 * Parses and validates the JWT from the Authorization header.
 *
 * @throws {UnauthorizedError} when the token is missing, expired, or invalid.
 */
export function requireAuth(req: Request): JwtPayload { … }
```

Do not document errors that represent programmer mistakes and should not be caught in production code.

## Type and interface documentation

```ts
/**
 * Represents the complete input contract for creating a product.
 * Validated at the API boundary with Zod before reaching services.
 */
export type ProductInput = {
  /** Display name. 1–200 characters. */
  name: string;
  /** Price in the smallest currency unit (e.g. cents). Must be ≥ 0. */
  priceMinorUnits: number;
  /** ISO 4217 currency code, e.g. "USD". */
  currency: string;
};
```

## Deprecated with migration path

```ts
/**
 * @deprecated Use `createProduct(input)` from `product-service` instead.
 *             This function will be removed in v3.0.
 */
export function addProduct(name: string, price: number) { … }
```

## Internal helpers

```ts
/** @internal */
export function _normalizeSlug(raw: string): string { … }
```

Use `@internal` rather than making the function unexported when it must be exported for testing or cross-file use.

## Class documentation

```ts
/**
 * Manages product data access for the Netlify Functions layer.
 *
 * All methods fail with a `DatabaseError` on connection failure.
 * Instantiate once at module scope and reuse across warm invocations.
 */
export class ProductRepository {
  /**
   * @param sql - Neon serverless SQL executor from `@neondatabase/serverless`.
   */
  constructor(private readonly sql: NeonQueryFunction) {}
}
```

## Common tags

| Tag | When to use |
|---|---|
| `@param` | Parameter meaning is not clear from name + type |
| `@returns` | Return shape is complex or multi-purpose |
| `@throws` | Caller must handle the error |
| `@example` | Usage is not obvious or important to illustrate |
| `@deprecated` | Retiring an API; always include migration path |
| `@internal` | Exported but not part of the public API |
| `@see` | Link to related function, type, or external doc |
| `@since` | When the item was added (useful in libraries) |

## Anti-patterns

```ts
// Bad — repeats what TypeScript already says
/**
 * @param name string name of the user
 * @returns string greeting
 */
function greet(name: string): string { … }

// Bad — documents implementation, not contract
/**
 * Calls Array.prototype.find to locate the item.
 */
function findItem(id: string): Item | undefined { … }

// Good — explains non-obvious constraint
/**
 * Returns the first active item with the given ID.
 * Returns `undefined` if no active item exists; archived items are excluded.
 */
function findItem(id: string): Item | undefined { … }
```
