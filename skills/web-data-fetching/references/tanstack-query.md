# TanStack Query Patterns

Patterns for data fetching, cache management, and mutations using TanStack Query v5.

## Setup

```ts
// src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

Wrap the app:

```tsx
// src/app.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}
```

## Query key conventions

Keep keys stable, typed, and include all inputs that affect the result:

```ts
// src/lib/query-keys.ts
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters: ProductFilters) => ["products", "list", filters] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    byUser: (userId: string) => ["orders", "user", userId] as const,
  },
} as const;
```

## Typed query hook

```ts
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});

async function fetchProduct(id: string) {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ProductSchema.parse(await res.json());
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: Boolean(id),
  });
}
```

Usage in component:

```tsx
function ProductPage({ id }: { id: string }) {
  const { data, isPending, isError, error } = useProduct(id);

  if (isPending) return <Spinner />;
  if (isError) return <ErrorBanner message={error.message} />;
  return <ProductDetail product={data} />;
}
```

## Mutation with cache invalidation

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateOrderInput {
  productId: string;
  quantity: number;
}

async function createOrder(input: CreateOrderInput) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useCreateOrder(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Invalidate the user's order list so it refetches
      qc.invalidateQueries({ queryKey: queryKeys.orders.byUser(userId) });
    },
  });
}
```

Usage:

```tsx
const { mutate, isPending, isError } = useCreateOrder(user.id);

<button
  onClick={() => mutate({ productId: "123", quantity: 1 })}
  disabled={isPending}
  aria-busy={isPending}
>
  {isPending ? "Ordering…" : "Add to order"}
</button>
```

## Optimistic update pattern

```ts
export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onMutate: async (updated) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: queryKeys.products.detail(updated.id) });
      // Snapshot previous value for rollback
      const previous = qc.getQueryData(queryKeys.products.detail(updated.id));
      // Optimistically update the cache
      qc.setQueryData(queryKeys.products.detail(updated.id), (old) => ({
        ...old,
        ...updated,
      }));
      return { previous };
    },
    onError: (_err, updated, context) => {
      // Roll back on failure
      qc.setQueryData(queryKeys.products.detail(updated.id), context?.previous);
    },
    onSettled: (_, __, updated) => {
      // Always refetch after error or success
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(updated.id) });
    },
  });
}
```

## Rules

- Keep query keys in one canonical file; never inline arrays ad hoc.
- Validate API responses with Zod before placing them in the cache.
- Use `enabled: false` to prevent queries from firing until inputs are ready.
- Prefer `invalidateQueries` over `setQueryData` after mutations unless optimistic updates are needed.
- Do not retry mutations; only retry idempotent queries.
- User-specific data: set `staleTime` appropriately to avoid showing stale personal data.
