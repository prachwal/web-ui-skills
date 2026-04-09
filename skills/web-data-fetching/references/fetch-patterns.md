# Fetch Patterns

Core utilities for safe, cancellable, and retryable data fetching without external libraries.

## Typed state machine

Use a discriminated union to make loading states explicit and exhaustive in components:

```ts
export type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

In a Preact component using signals:

```ts
import { signal } from "@preact/signals";

const state = signal<FetchState<Product[]>>({ status: "idle" });

async function loadProducts(categoryId: string) {
  state.value = { status: "loading" };
  try {
    const data = await fetchProducts(categoryId);
    state.value = { status: "success", data };
  } catch (err) {
    state.value = { status: "error", message: toErrorMessage(err) };
  }
}
```

Render side:

```tsx
{state.value.status === "loading" && <Spinner />}
{state.value.status === "error" && <ErrorBanner message={state.value.message} />}
{state.value.status === "success" && <ProductList items={state.value.data} />}
```

## Cancellable fetch with AbortController

Use `AbortController` for input-driven fetches (search, filters) to prevent stale responses:

```ts
let currentAbort: AbortController | null = null;

export async function fetchProducts(categoryId: string): Promise<Product[]> {
  // Cancel the previous in-flight request
  currentAbort?.abort();
  currentAbort = new AbortController();

  const url = new URL("/api/products", window.location.origin);
  url.searchParams.set("category", categoryId);

  const res = await fetch(url, { signal: currentAbort.signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Product[]>;
}
```

Guard the abort error so it does not appear as a user-visible error:

```ts
try {
  const data = await fetchProducts(id);
  state.value = { status: "success", data };
} catch (err) {
  if (err instanceof DOMException && err.name === "AbortError") return;
  state.value = { status: "error", message: toErrorMessage(err) };
}
```

## Fetch with bounded exponential backoff

Use for idempotent GET requests that may fail transiently (network blips, rate limits):

```ts
export async function fetchWithRetry<T>(
  url: string,
  init?: RequestInit,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url, init);
      // Only retry on server errors, not on client errors (4xx)
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        // Exponential backoff: 200ms, 400ms
        await delay(200 * 2 ** attempt);
      }
    }
  }
  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

## Utility: error to message

Normalize any thrown value to a string for display:

```ts
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
}
```

## Rules

- Cancel or version every input-driven fetch.
- Retry only idempotent requests; never auto-retry mutations.
- Bound retry attempts and use a delay to avoid request storms.
- Always separate `AbortError` from real errors in the UI.
- Keep fetch utilities free of component references — they should be pure functions.
