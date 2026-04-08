# Responsive loading and bundle optimization

## Bundle analysis

Before optimizing, measure what you are shipping:

```bash
# Vite bundle visualizer
npm install --save-dev rollup-plugin-visualizer
# Add to vite.config.ts plugins: visualizer({ open: true })
npm run build
```

Target: initial JS bundle ≤ 150 KB gzipped for most SPAs.

## Code splitting

### Route-level (always do this)

```tsx
import { lazy, Suspense } from 'preact/compat';

const Dashboard = lazy(() => import('./features/dashboard/DashboardView'));
const Settings  = lazy(() => import('./features/settings/SettingsView'));

function App() {
  return (
    <Router>
      <Suspense fallback={<PageSkeleton />}>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings"  component={Settings} />
      </Suspense>
    </Router>
  );
}
```

### Component-level (for heavy widgets)

```tsx
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));

// Only load when the editor is actually shown
{isEditing && (
  <Suspense fallback={<p>Loading editor…</p>}>
    <RichTextEditor />
  </Suspense>
)}
```

## Tree shaking

- Import named exports only: `import { format } from 'date-fns'` (not the whole lib).
- Avoid `import * as lib from 'lib'` — prevents tree shaking.
- Check that your Vite/Rollup build strips unused exports; use the bundle visualizer to verify.

## Preloading critical routes

Tell the browser to prefetch routes the user is likely to visit next:

```html
<link rel="prefetch" href="/dashboard.js" as="script">
```

Or trigger dynamically on hover:

```ts
function prefetchDashboard() {
  import('./features/dashboard/DashboardView'); // warm the module cache
}
<a href="/dashboard" onMouseEnter={prefetchDashboard}>Dashboard</a>
```

## Mobile-first asset loading

- Write CSS mobile-first (base styles for small screens; add complexity at wider breakpoints).
- Avoid loading desktop-only components on mobile; gate heavy features behind a viewport size signal.
- Use `media` attribute on `<link>` for non-critical stylesheets:

```html
<link rel="stylesheet" href="/print.css" media="print">
<link rel="stylesheet" href="/desktop-extras.css" media="(min-width: 1024px)">
```

## Critical CSS

Inline the styles needed to render above-the-fold content; load the rest async:

```html
<style>/* critical styles inlined by build tool */</style>
<link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/styles.css"></noscript>
```

## Caching strategy

| Asset type | Cache-Control |
|---|---|
| HTML entry point | `no-cache` (revalidate every request) |
| Hashed JS / CSS bundles | `public, max-age=31536000, immutable` |
| Images with hash suffix | `public, max-age=31536000, immutable` |
| Fonts | `public, max-age=31536000, immutable` |
| API responses (read-only) | `public, s-maxage=60, stale-while-revalidate=300` |
| API responses (auth) | `no-store` |

## Service Worker caching (Workbox)

```ts
// vite-plugin-pwa generates this automatically
// Precache app shell; runtime cache images and API responses
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images', plugins: [new ExpirationPlugin({ maxEntries: 60 })] })
);
```

## Defer non-critical scripts

```html
<!-- Third-party analytics, chat widgets, tag managers — load after page is interactive -->
<script src="https://analytics.example.com/tracker.js" defer></script>
```

Never use `async` for scripts that depend on DOM being ready; use `defer` instead.

## Performance checklist

- [ ] Bundle visualizer run; no unexpected large dependencies
- [ ] Routes lazy-loaded; initial JS ≤ 150 KB gzipped
- [ ] Named imports from large libraries (date-fns, lodash)
- [ ] Critical CSS inlined; rest async
- [ ] Hashed assets have `immutable` cache headers
- [ ] Analytics and tag managers loaded with `defer`
- [ ] Mobile profiled on Lighthouse with Slow 4G preset
