# Sitemap and Robots

Patterns for sitemap XML, robots.txt, and route-level crawl control.

## sitemap.xml entry format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Static pages -->
  <url>
    <loc>https://example.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://example.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- Dynamic product pages — generate one <url> per public product -->
  <url>
    <loc>https://example.com/products/classic-wool-coat</loc>
    <lastmod>2026-04-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

</urlset>
```

Rules:
- Use absolute URLs with the canonical domain.
- `<lastmod>` uses ISO 8601 format (`YYYY-MM-DD`).
- `<priority>` is 0.0–1.0; search engines may ignore it, but it signals importance ordering.
- Exclude private, noindex, and paginated pages.
- Maximum 50,000 URLs per sitemap file; use a sitemap index file for larger sites.

## Dynamic sitemap generation (Netlify Function)

Generate the sitemap at request time for sites with dynamic content:

```ts
// netlify/functions/sitemap.ts
import { getPublicProducts } from "../../src/services/products";
import type { Config } from "@netlify/functions";

const SITE = "https://example.com";

const STATIC_ROUTES = [
  { loc: "/",        priority: "1.0", changefreq: "weekly"  },
  { loc: "/about",   priority: "0.5", changefreq: "monthly" },
  { loc: "/contact", priority: "0.3", changefreq: "yearly"  },
];

export default async (_req: Request) => {
  const products = await getPublicProducts();

  const dynamicRoutes = products.map((p) => ({
    loc:          `/products/${p.slug}`,
    priority:     "0.8",
    changefreq:   "weekly",
    lastmod:      p.updatedAt.toISOString().slice(0, 10),
  }));

  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];

  const urls = allRoutes.map((r) => `
  <url>
    <loc>${SITE}${r.loc}</loc>
    ${r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ""}
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

export const config: Config = { path: "/sitemap.xml" };
```

## robots.txt

```
# robots.txt — placed at public/robots.txt (Vite) or in the publish directory

User-agent: *
Allow: /

# Block internal tools, staging pages, search/filter result pages
Disallow: /admin/
Disallow: /preview/
Disallow: /api/
Disallow: /search?*

# Block paginated pages beyond page 1 (adjust to your URL pattern)
# Disallow: /products?page=

Sitemap: https://example.com/sitemap.xml
```

## Preview / staging deploy lockdown

Block all crawlers on non-production deployments. Add to `netlify.toml`:

```toml
[context.deploy-preview.headers]
  for = "/*"
  X-Robots-Tag = "noindex, nofollow"

[context.branch-deploy.headers]
  for = "/*"
  X-Robots-Tag = "noindex, nofollow"
```

Also add a meta tag in preview builds:

```ts
// In your metadata utility, check the deploy context
if (import.meta.env.VITE_DEPLOY_CONTEXT !== "production") {
  setMeta("robots", "noindex, nofollow");
}
```

## Crawl control per route

| Use case | Directive |
|---|---|
| Normal public page | `index, follow` (default — no tag needed) |
| Private/internal page | `noindex, nofollow` |
| Paginated page (not the first) | `noindex, follow` |
| Syndicated content (original elsewhere) | `noindex, follow` or use canonical |
| Thank you / confirmation page | `noindex` |
| Search result page with many params | `noindex, follow` |

Use the `<meta name="robots">` tag per page, not just `robots.txt`, because `robots.txt` only prevents crawling, not indexing (a crawler can index content linked from elsewhere without fetching it).
