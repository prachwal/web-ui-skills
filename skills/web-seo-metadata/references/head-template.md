# HTML Head Template

Complete `<head>` template for pages that need SEO, social previews, and canonical URLs.

## Full template

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary SEO -->
  <title>Product Name | Brand</title>
  <meta name="description" content="A clear, specific description of this page's content. 50–160 characters." />
  <link rel="canonical" href="https://example.com/products/product-name" />

  <!-- Robots — only add when overriding the default (index, follow) -->
  <!-- <meta name="robots" content="noindex, nofollow" /> -->

  <!-- Open Graph (Facebook, LinkedIn, Slack, iMessage previews) -->
  <meta property="og:type"        content="product" />
  <meta property="og:title"       content="Product Name" />
  <meta property="og:description" content="A clear, specific description. Aim for 100–200 characters." />
  <meta property="og:url"         content="https://example.com/products/product-name" />
  <meta property="og:image"       content="https://example.com/og/product-name.jpg" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt"   content="Front view of Product Name in grey" />
  <meta property="og:site_name"   content="Brand" />
  <meta property="og:locale"      content="en_US" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@brandhandle" />
  <meta name="twitter:title"       content="Product Name" />
  <meta name="twitter:description" content="Same as og:description." />
  <meta name="twitter:image"       content="https://example.com/og/product-name.jpg" />
  <meta name="twitter:image:alt"   content="Front view of Product Name in grey" />

  <!-- Favicon and app icons -->
  <link rel="icon" type="image/svg+xml"  href="/icons/favicon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

  <!-- Web App Manifest (required for PWA) -->
  <link rel="manifest" href="/manifest.json" />

  <!-- Theme color (browser chrome in mobile) -->
  <meta name="theme-color" content="#0055cc" />
</head>
```

## Preact / SPA dynamic head update

In an SPA, update head tags on route change using a utility function:

```ts
// src/lib/metadata.ts
export interface PageMetadata {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
}

export function setMetadata(meta: PageMetadata): void {
  const { title, description, canonical, ogImage, ogImageAlt, noIndex } = meta;

  document.title = `${title} | Brand`;
  setMeta("description", description);
  setLink("canonical", canonical);

  // Open Graph
  setOg("og:title",       title);
  setOg("og:description", description);
  setOg("og:url",         canonical);
  if (ogImage) {
    setOg("og:image",     ogImage);
    setOg("og:image:alt", ogImageAlt ?? "");
  }

  // Twitter/X
  setMeta("twitter:title",       title);
  setMeta("twitter:description", description);

  // Robots
  const robotsContent = noIndex ? "noindex, nofollow" : "index, follow";
  setMeta("robots", robotsContent);
}

function setMeta(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOg(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string): void {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
```

Usage in a Preact route component:

```ts
useEffect(() => {
  setMetadata({
    title: product.name,
    description: product.summary,
    canonical: `https://example.com/products/${product.slug}`,
    ogImage: product.coverImage.src,
    ogImageAlt: product.coverImage.alt,
  });
}, [product]);
```

## Social image dimensions

| Platform | Recommended size | Minimum size | Aspect ratio |
|---|---|---|---|
| Open Graph (general) | 1200×630 | 600×315 | 1.91:1 |
| Twitter summary_large_image | 1200×628 | 300×157 | ~1.91:1 |
| WhatsApp / iMessage | 1200×630 | 300×200 | flexible |

- Use absolute URLs for all image references (not relative paths).
- Verify images are publicly accessible without authentication.
- Use a CDN or image optimization service for OG images.
