# Routing

Preact's official meta-framework (`preact-iso`) ships a lightweight router.
Use `preact-router` as an alternative if you are not using preact-iso.

## Setup (preact-iso)

Scaffolded automatically by `npm create preact@latest`.

```sh
npm install preact-iso
```

```tsx
// src/app.tsx
import { LocationProvider, Router, Route } from 'preact-iso';
import { HomePage } from './routes/HomePage';
import { ProductsRoute } from './routes/ProductsRoute';
import { NotFound } from './routes/NotFound';

export function App() {
  return (
    <LocationProvider>
      <Router>
        <Route path="/" component={HomePage} />
        <Route path="/products" component={ProductsRoute} />
        <Route path="/products/:id" component={ProductDetailRoute} />
        <Route default component={NotFound} />
      </Router>
    </LocationProvider>
  );
}
```

## Reading route params

```tsx
import { useRoute } from 'preact-iso';

export function ProductDetailRoute() {
  const { params } = useRoute();
  // params.id — from path="/products/:id"
  return <ProductDetailView id={params.id} />;
}
```

## Programmatic navigation

```tsx
import { useLocation } from 'preact-iso';

function BackButton() {
  const { route } = useLocation();
  return <button onClick={() => route('/products')}>Back</button>;
}
```

## Links

```tsx
// preact-iso handles <a href> natively — no special Link component needed
<a href="/products">Products</a>
```

## Lazy routes (code splitting)

```tsx
import { lazy, Suspense } from 'preact/compat';

const ProductsRoute = lazy(() => import('./routes/ProductsRoute'));
const DashboardRoute = lazy(() => import('./routes/DashboardRoute'));

export function App() {
  return (
    <LocationProvider>
      <Suspense fallback={<p>Loading…</p>}>
        <Router>
          <Route path="/products" component={ProductsRoute} />
          <Route path="/dashboard" component={DashboardRoute} />
          <Route default component={NotFound} />
        </Router>
      </Suspense>
    </LocationProvider>
  );
}
```

## Route-level layout

Keep route components thin — they just compose feature Views:

```tsx
// routes/ProductsRoute.tsx
import { ProductListView } from '../features/products/ProductListView';
import { PageContainer } from '../components/layout/PageContainer';

export function ProductsRoute() {
  return (
    <PageContainer>
      <h1>Products</h1>
      <ProductListView />
    </PageContainer>
  );
}
```

## Rules

- Never parse `window.location` or `window.history` directly — use the router hooks.
- Keep route components thin; delegate rendering to feature Views.
- Lazy-load every non-critical route to keep the initial bundle small.
- Handle 404 with a `<Route default>` at the end of the Router.
- Keep navigation actions in the ViewModel, not spread across View components.
- Prefer hash-routing only for environments that cannot serve from a path — default to HTML5 history.
