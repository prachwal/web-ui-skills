# TypeScript type design

## Utility types reference

```ts
// Partial — all properties optional
type DraftProduct = Partial<Product>;

// Required — all properties required
type StrictConfig = Required<Config>;

// Pick — subset of keys
type ProductSummary = Pick<Product, "id" | "name" | "price">;

// Omit — all keys except listed
type ProductInput = Omit<Product, "id" | "createdAt">;

// Record — map from key type to value type
type StatusMap = Record<ProductId, "active" | "archived">;

// Readonly — prevent mutation
type ImmutableProduct = Readonly<Product>;

// ReturnType — extract function return type
type ServiceResult = ReturnType<typeof fetchProducts>;
```

## Discriminated unions for state

Model all possible states; never add optional fields to handle different modes:

```ts
// Bad: optional fields force null checks everywhere
type Product = {
  id: string;
  name: string;
  archivedAt?: Date;
  archiveReason?: string; // only meaningful when archivedAt is set
};

// Good: each state carries only relevant fields
type Product =
  | { status: "active"; id: string; name: string }
  | { status: "archived"; id: string; name: string; archivedAt: Date; reason: string };
```

## Branded types

Prevent mixing structurally compatible primitives at compile time:

```ts
type UserId = string & { readonly _brand: "UserId" };
type ProductId = string & { readonly _brand: "ProductId" };

function asUserId(id: string): UserId {
  return id as UserId;
}

// This catches mixing at compile time, not runtime:
function getUser(id: UserId): Promise<User> { … }
const pid = asProductId("p_123");
getUser(pid); // TS error: ProductId is not assignable to UserId
```

## Generics: constraints and defaults

```ts
// Constrain to known key-value shapes
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map(k => [k, obj[k]])) as Pick<T, K>;
}

// Default type parameters for optional generics
type Paginated<T = unknown> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

// Conditional types
type Nullable<T> = T extends null | undefined ? never : T;
```

## Template literal types

Useful for string-keyed maps and event names:

```ts
type EventName<T extends string> = `on${Capitalize<T>}`;
type ProductEvent = EventName<"create" | "update" | "delete">;
// "onCreate" | "onUpdate" | "onDelete"

type RouteParam<T extends string> = `:${T}`;
type ProductRoute = `/api/products/${RouteParam<"id">}`;
// "/api/products/:id"
```

## Const assertions and satisfies

```ts
// Freeze shape at definition; infer literal types
const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number]; // "admin" | "editor" | "viewer"

// satisfies validates shape without widening the type
const config = {
  timeout: 5000,
  retries: 3,
  region: "us-east-1",
} satisfies Partial<ServiceConfig>;
// config.region is still "us-east-1", not string
```

## Mapped types

```ts
// Make all methods async
type AsyncMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K];
};

// Optional-to-required with explicit undefined
type WithUndefined<T> = {
  [K in keyof T]-?: T[K] | undefined;
};
```

## infer keyword

Extract inner types from complex generics:

```ts
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type UnwrapArray<T> = T extends Array<infer U> ? U : T;

type Row = UnwrapPromise<ReturnType<typeof fetchProducts>>; // Product[]
type Product = UnwrapArray<Row>; // Product
```
