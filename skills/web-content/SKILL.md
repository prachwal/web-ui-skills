---
name: web-content
description: Use when building or reviewing content-heavy pages, CMS integrations, editorial workflows, empty states, error pages, and marketing pages. Covers content structure, readability, copy quality, rich text rendering, and content safety.
---

# Web Content Skill

Use this skill when a page or feature depends on dynamic content, a CMS, editorial copy, empty states, or marketing-oriented layout and text quality.

## Core goals

- Render CMS and user-generated content safely without XSS risk.
- Keep content structure semantic and readable across devices and zoom levels.
- Provide honest, helpful empty states and error pages.
- Align visible copy with SEO metadata and accessibility names.
- Treat content schema as part of the product contract, not an afterthought.

## Checklist

- [ ] HTML from CMS or rich text editor is sanitized before rendering.
- [ ] Content schema defines required and optional fields explicitly.
- [ ] Empty states explain what is absent and offer a next action.
- [ ] Error pages (404, 500) match site branding and provide navigation.
- [ ] Heading hierarchy is correct (`h1` → `h2` → `h3`) without gaps.
- [ ] Long-form content uses correct semantic elements: `<article>`, `<section>`, `<aside>`, `<figure>`, `<blockquote>`.
- [ ] Images have `alt` text defined in the CMS content model, not left optional.
- [ ] Links in body copy have descriptive text, not "click here" or "read more".
- [ ] Dates and numbers use locale-aware formatting.
- [ ] Marketing pages use real copy, not lorem ipsum placeholders, before accessibility review.
- [ ] Content changes do not require a full redeploy when a CMS is in use.

## Safe rich text rendering

Never inject CMS HTML directly. Always sanitize:

```ts
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "a", "ul", "ol", "li",
                      "h2", "h3", "h4", "blockquote", "figure", "figcaption",
                      "img", "code", "pre"];

const ALLOWED_ATTR = ["href", "title", "target", "rel", "src", "alt", "width", "height"];

export function safeHtml(raw: string): string {
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Force noopener on external links
    FORCE_BODY: false,
    ADD_ATTR: ["rel"],
  });
}

// In component (Preact):
<div
  class="rich-text"
  dangerouslySetInnerHTML={{ __html: safeHtml(post.body) }}
/>
```

## External link safety

Add `rel="noopener noreferrer"` to all external links, including those from CMS content:

```ts
// After DOMPurify, patch external links
export function patchExternalLinks(container: HTMLElement, siteOrigin: string) {
  container.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    if (!a.href.startsWith(siteOrigin)) {
      a.setAttribute("rel", "noopener noreferrer");
      a.setAttribute("target", "_blank");
    }
  });
}
```

## Empty state pattern

```tsx
interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
}

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section aria-labelledby="empty-title" class="empty-state">
      <h2 id="empty-title">{title}</h2>
      <p>{description}</p>
      {action && <a href={action.href} class="btn">{action.label}</a>}
    </section>
  );
}

// Usage:
<EmptyState
  title="No products found"
  description="Try adjusting your filters or search terms."
  action={{ label: "Clear filters", href: "/products" }}
/>
```

## Content schema rules

Define content types with required fields and validation before building the CMS:

```ts
import { z } from "zod";

const ArticleSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  publishedAt: z.coerce.date(),
  summary: z.string().min(50).max(300),
  body: z.string().min(100),
  coverImage: z.object({
    src: z.string().url(),
    alt: z.string().min(1, "Alt text is required for cover images"),
    width: z.number(),
    height: z.number(),
  }),
  author: z.string().min(1),
});

type Article = z.infer<typeof ArticleSchema>;
```

## 404 and error page rules

- Match site navigation and branding.
- Keep heading clear: "Page not found" or "Something went wrong".
- Offer at least one forward path: home, search, or common links.
- Log 404s server-side to detect broken links.
- Do not expose stack traces or internal paths on 500 pages.

## Testing focus

- CMS content renders correctly at various content lengths (short, long, empty).
- XSS vectors in CMS content are sanitized correctly.
- Empty states appear when collections are empty, not loading skeletons stuck indefinitely.
- External links have `noopener` and open in a new tab.
- Heading hierarchy is correct after CMS edits.
- 404 and 500 pages are reachable and styled correctly.

## References

- [MDN: DOMPurify](https://github.com/cure53/DOMPurify)
- [MDN: Content sectioning](https://developer.mozilla.org/en-US/docs/Web/HTML/Element#content_sectioning)
- [web.dev: Writing accessible descriptions](https://web.dev/articles/accessible-responsive-tables)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
