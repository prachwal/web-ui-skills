---
name: web-seo-metadata
description: Use when implementing or reviewing SEO, route metadata, social previews, robots directives, sitemaps, canonical URLs, and structured data for web pages and SPAs.
---

# Web SEO Metadata Skill

Use this skill when a page needs to be discoverable, shareable, and represented correctly by crawlers and social preview systems.

## Core goals

- Give every indexable route a unique title, description, canonical URL, and share preview.
- Keep metadata consistent with the visible page content.
- Avoid crawler traps, duplicate canonical targets, and stale social images.
- Treat SPA routes and static routes as first-class pages with explicit metadata.

## Checklist

- [ ] Each indexable route has a concise, unique `<title>`.
- [ ] Each indexable route has a useful `meta name="description"` aligned with page content.
- [ ] Canonical URLs are absolute, stable, and point to the preferred URL.
- [ ] Non-indexable pages use intentional `robots` directives such as `noindex`.
- [ ] Open Graph and Twitter/X card tags are present for shareable pages.
- [ ] Social preview images are the correct dimensions, absolute URLs, and not blocked by auth.
- [ ] `sitemap.xml` includes canonical public routes and excludes private or temporary routes.
- [ ] `robots.txt` does not accidentally block important assets or pages.
- [ ] Structured data uses JSON-LD and matches visible content.
- [ ] SPA route metadata updates on navigation and has a crawler-compatible rendering strategy.

## Implementation rules

- Prefer route-level metadata definitions over scattered ad hoc `<head>` edits.
- Keep title patterns consistent, such as `Page | Product`.
- Do not keyword-stuff titles, descriptions, headings, or structured data.
- Use one canonical URL per content page and avoid conflicting canonical/redirect behavior.
- Use `hreflang` only when localized equivalents are real and bidirectionally linked.
- Include image alt text for visible images; social image metadata is not a substitute for accessibility.

## Testing focus

- Inspect rendered HTML, not only source templates.
- Test social previews with platform validators when launch quality matters.
- Verify redirects, canonical URLs, and sitemap entries agree.
- Check that staging, preview, and private routes are not indexed.
- Re-test metadata after routing, localization, or CMS changes.

## References

- [Google Search Central: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google Search Central: robots meta tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Google Search Central: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Open Graph protocol](https://ogp.me/)
- [Schema.org JSON-LD](https://schema.org/docs/gs.html)
