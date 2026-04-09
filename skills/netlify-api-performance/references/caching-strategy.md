# Netlify API Caching Strategy

HTTP cache headers, Netlify Cache API, and Blobs — when to use each and code patterns for each.

## Caching primitives comparison

| Primitive | Scope | Consistency | Best for |
|---|---|---|---|
| HTTP `Cache-Control` headers | CDN edge (global) | Strong with `must-revalidate` | Public GET responses that can be stale for seconds–minutes |
| Netlify Cache API | Per-region | Last-write-wins | Computed or aggregated results that are expensive to rebuild |
| Netlify Blobs | Site-wide (eventual) | Eventual (updates ~60s globally) | Generated assets, rendered pages, user uploads |
| In-module variable | Warm invocation only | None across invocations | Trivial in-memory lookups for single warm instance |

## HTTP cache headers

```ts
// Public CDN-cacheable GET response — do not use for authenticated data
export default async (req: Request) => {
  const data = await fetchCatalog();

  return Response.json({ data }, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "CDN-Cache-Control": "public, max-age=120",   // Netlify edge override
      "Vary": "Accept-Encoding",
    },
  });
};

// Private response (authenticated) — never cache at CDN
return Response.json({ data }, {
  headers: {
    "Cache-Control": "private, no-store",
  },
});
```

## Netlify Cache API (programmatic)

```ts
// Expensive computed summary — cache for 5 minutes
export default async (req: Request) => {
  const cacheKey = new Request("https://cache.internal/summary/v1");
  const cache = await caches.open("api");

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const summary = await buildSummary();          // expensive DB or compute operation
  const response = Response.json({ data: summary }, {
    headers: {
      "Cache-Control": "public, max-age=300",    // Cache API respects this TTL
    },
  });

  await cache.put(cacheKey, response.clone());
  return response;
};

// Cache invalidation on write
async function invalidateSummaryCache() {
  const cache = await caches.open("api");
  await cache.delete(new Request("https://cache.internal/summary/v1"));
}
```

> **Note**: Netlify Cache API data is shared within a region, not globally replicated. Cross-region cache misses are expected. Cache is also cleared on redeploy.

## Netlify Blobs for rendered output

```ts
import { getStore } from "@netlify/blobs";

const store = getStore("rendered-pages");

export default async (req: Request) => {
  const slug = new URL(req.url).searchParams.get("slug") ?? "index";

  // Try blob cache
  const cached = await store.get(slug, { type: "text" });
  if (cached) {
    return new Response(cached, {
      headers: { "Content-Type": "text/html", "X-Cache": "HIT" },
    });
  }

  // Expensive render
  const html = await renderPage(slug);
  await store.set(slug, html);

  return new Response(html, {
    headers: { "Content-Type": "text/html", "X-Cache": "MISS" },
  });
};
```

## Rules

- Use HTTP headers for public, CDN-cacheable GET endpoints first.
- Use Cache API when you need programmatic TTL or invalidation inside Functions.
- Use Blobs for large objects, generated assets, or when the data outlives a single function invocation.
- Never assume Cache API entries are globally consistent — account for regional misses.
- Add `X-Cache` or `X-Cache-Status` headers to aid debugging.
- Purge or invalidate caches on relevant write paths.
