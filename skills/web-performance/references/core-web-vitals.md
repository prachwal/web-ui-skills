# Core Web Vitals

Use these as the default performance baseline for every production deployment.

## Metrics and thresholds

| Metric | Good | Needs improvement | Poor | Measures |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5 s | ≤ 4 s | > 4 s | Perceived load speed |
| **INP** (Interaction to Next Paint) | ≤ 200 ms | ≤ 500 ms | > 500 ms | Interaction responsiveness |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 | Visual stability |

## LCP — what to do

The LCP element is usually the hero image, above-the-fold text block, or background image.

- Add `fetchpriority="high"` and `loading="eager"` on the LCP `<img>`.
- Preconnect to CDN/font origins: `<link rel="preconnect" href="https://fonts.gstatic.com">`.
- Preload the LCP image: `<link rel="preload" as="image" href="/hero.webp">`.
- Serve the LCP resource from the same origin or a preconnected CDN (avoid third-party blocking chains).
- Eliminate render-blocking `<script>` and `<link rel="stylesheet">` above the fold.
- Use `font-display: optional` or `swap` to prevent invisible-text periods blocking LCP text.

```html
<!-- Preload LCP hero image -->
<link rel="preload" as="image" href="/images/hero.webp" fetchpriority="high">

<!-- LCP image element -->
<img src="/images/hero.webp" alt="Hero" fetchpriority="high" loading="eager" width="1200" height="600">
```

## INP — what to do

INP measures the worst interaction latency across the page visit.

- Break up long tasks with `scheduler.yield()` or `setTimeout(fn, 0)` where the browser needs time to paint.
- Move heavy computation off the main thread with Web Workers.
- Avoid synchronous DOM reads followed immediately by writes in the same task (layout thrashing).
- Debounce input handlers, search triggers, and resize listeners.
- Minimize component re-render scope — signals update only the DOM node, not the full component tree.

```ts
// Yield to the browser between heavy chunks
async function processChunks(items: Item[]) {
  for (let i = 0; i < items.length; i++) {
    process(items[i]);
    if (i % 100 === 0) await scheduler.yield();  // let browser paint
  }
}
```

## CLS — what to do

Layout shifts happen when content moves after it is painted.

- Always specify `width` and `height` on `<img>`, `<video>`, and `<iframe>`.
- Reserve space for ads, embeds, and asynchronously loaded banners with CSS `aspect-ratio` or a placeholder div.
- Avoid inserting content above existing content — add below, or use placeholder rows.
- Use `font-display: optional` to prevent font-swap shifts (text shows system font until page is cached).
- Animate with `transform` and `opacity` only — they do not trigger layout.

```css
/* Reserve space for lazy-loaded image */
.hero-image {
  aspect-ratio: 16 / 9;
  width: 100%;
  background: var(--color-skeleton);
}
```

## Measurement tools

- **Chrome DevTools → Performance panel**: record interaction traces, identify long tasks and layout shifts.
- **Lighthouse** (`npx lighthouse https://…`): lab score and actionable recommendations.
- **web-vitals JS library**: measure real-user CWV in production.
- **PageSpeed Insights / CrUX**: field data by URL from real Chrome users.

```ts
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(({ value }) => analytics.track('lcp', value));
onINP(({ value }) => analytics.track('inp', value));
onCLS(({ value }) => analytics.track('cls', value));
```

## Quick wins checklist

- [ ] LCP element identified and `fetchpriority="high"` set
- [ ] No render-blocking scripts or styles above the fold
- [ ] All images have explicit `width` and `height`
- [ ] Long tasks ≤ 50 ms on main thread
- [ ] Fonts use `font-display: optional` or `swap`
- [ ] CWV measured in production with web-vitals library
