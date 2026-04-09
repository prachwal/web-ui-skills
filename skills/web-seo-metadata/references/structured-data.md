# Structured Data

JSON-LD schema patterns for common page types. Place inside `<script type="application/ld+json">` in `<head>`.

## Product page

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Classic Wool Coat",
  "description": "Tailored full-length wool coat in charcoal grey.",
  "image": [
    "https://example.com/images/coat-front.jpg",
    "https://example.com/images/coat-back.jpg"
  ],
  "sku": "COAT-WL-CHAR-M",
  "brand": {
    "@type": "Brand",
    "name": "Acme Apparel"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/classic-wool-coat",
    "priceCurrency": "USD",
    "price": "299.00",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Acme Store"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "127"
  }
}
</script>
```

## Article / blog post

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to care for wool garments",
  "description": "Practical steps for washing, drying, and storing wool at home.",
  "image": "https://example.com/og/wool-care.jpg",
  "datePublished": "2026-03-15",
  "dateModified":  "2026-04-01",
  "author": {
    "@type": "Person",
    "name": "Jane Smith",
    "url": "https://example.com/authors/jane-smith"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Acme Blog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/icons/logo-200.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/blog/wool-care"
  }
}
</script>
```

## Organization (site-wide, in homepage `<head>`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Acme Store",
  "url": "https://example.com",
  "logo": "https://example.com/icons/logo-512.png",
  "sameAs": [
    "https://twitter.com/acmestore",
    "https://www.instagram.com/acmestore"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-800-555-0100",
    "contactType": "customer service",
    "areaServed": "US",
    "availableLanguage": "English"
  }
}
</script>
```

## BreadcrumbList

Add to every page that has a clear breadcrumb path:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Clothing",
      "item": "https://example.com/clothing"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Classic Wool Coat",
      "item": "https://example.com/products/classic-wool-coat"
    }
  ]
}
</script>
```

## TypeScript helper for generating JSON-LD

Avoid manually constructing inline JSON strings:

```ts
// src/lib/json-ld.ts
export function jsonLdScript(data: Record<string, unknown>): string {
  // JSON.stringify with no dangerous characters for inline <script> injection
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

// In Preact component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: jsonLdScript(productSchema) }}
/>
```

Escaping `<`, `>`, and `&` is required when embedding JSON-LD inside HTML to prevent script injection.

## Rules

- One `<script type="application/ld+json">` per schema type per page — do not combine multiple schemas in one block if they are different root types.
- Keep structured data consistent with visible content. Google penalizes schemas that describe content not shown on the page.
- Validate with the [Google Rich Results Test](https://search.google.com/test/rich-results) before shipping.
- Include `dateModified` on articles and update it when content changes significantly.
- `priceCurrency` uses ISO 4217 3-letter codes (USD, EUR, GBP, PLN).
- `availability` uses Schema.org URLs exactly: `https://schema.org/InStock`, `https://schema.org/OutOfStock`, etc.
