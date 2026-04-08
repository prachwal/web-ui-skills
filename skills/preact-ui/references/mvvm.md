# MVVM Pattern in Preact

## Overview

MVVM separates an application into three layers:

| Layer | Role | Preact implementation |
|---|---|---|
| **Model** | Domain data, validation, business rules | Pure TS modules, no Preact imports |
| **ViewModel** | State, computed values, commands, data fetching | Custom hooks (`useXxxViewModel`) or signal stores |
| **View** | Rendering and user events | Functional components, no logic |

## Model

- Plain TypeScript: interfaces, types, factory functions, pure validation functions.
- No side effects, no framework imports.
- Can be tested with plain unit tests (no render required).

```ts
// models/productModel.ts
export interface Product { id: string; name: string; price: number; }
export type ProductErrors = Partial<Record<keyof Product, string>>;

export function validateProduct(p: Partial<Product>): ProductErrors {
  const errors: ProductErrors = {};
  if (!p.name?.trim()) errors.name = 'Name is required.';
  if ((p.price ?? -1) < 0) errors.price = 'Price must be non-negative.';
  return errors;
}
```

## ViewModel

- A custom hook that imports the Model and a Service.
- Exposes signals, computed values, and action functions — nothing else.
- Contains all business logic; the View just calls actions and reads signals.

```ts
// viewmodels/useProductViewModel.ts
import { signal, computed } from '@preact/signals';
import { validateProduct, Product } from '../models/productModel';
import { fetchProducts, saveProduct } from '../services/productService';

export function useProductListViewModel() {
  const items = signal<Product[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const total = computed(() => items.value.length);

  const load = async () => {
    loading.value = true;
    error.value = null;
    try {
      items.value = await fetchProducts();
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  };

  return { items, loading, error, total, load };
}
```

## View

- Imports the ViewModel hook; renders signals and calls actions.
- Contains no `if/else` business logic — only conditional rendering.
- Never calls services or imports models directly.

```tsx
// features/products/ProductListView.tsx
import { useEffect } from 'preact/hooks';
import { useProductListViewModel } from '../../viewmodels/useProductViewModel';

export function ProductListView() {
  const vm = useProductListViewModel();

  useEffect(() => { vm.load(); }, []);

  if (vm.loading.value) return <p>Loading…</p>;
  if (vm.error.value) return <p role="alert">{vm.error.value}</p>;

  return (
    <ul>
      {vm.items.value.map(p => (
        <li key={p.id}>{p.name} — {p.price}</li>
      ))}
    </ul>
  );
}
```

## Shared (module-level) signal store

For state shared across multiple routes or feature modules, define signals at the module level instead of inside a hook:

```ts
// viewmodels/cartStore.ts
import { signal, computed } from '@preact/signals';
import { CartItem } from '../models/cartModel';

export const cartItems = signal<CartItem[]>([]);
export const cartTotal = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.price * item.qty, 0)
);

export function addToCart(item: CartItem) {
  cartItems.value = [...cartItems.value, item];
}
```

Import directly in any View — no Provider or Context needed.

## Directory convention

```
src/
  models/
    productModel.ts
    cartModel.ts
  viewmodels/
    useProductViewModel.ts
    cartStore.ts             ← module-level signal store
  services/
    productService.ts
  features/
    products/
      ProductListView.tsx
      ProductDetailView.tsx
  routes/
    ProductsRoute.tsx        ← thin shell: import + render feature View
```

## Rules

- Models have zero Preact imports.
- ViewModels have zero JSX.
- Views have zero business logic.
- Services have zero UI state — they return typed data or throw.
- Test Models with unit tests; test ViewModels with hook tests; test Views with component tests.
