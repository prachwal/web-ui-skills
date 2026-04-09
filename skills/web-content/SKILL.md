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

## Reference files

### [`references/safe-rendering.md`](references/safe-rendering.md)
**CMS HTML sanitization** — DOMPurify setup with explicit `ALLOWED_TAGS`/`ALLOWED_ATTR` allowlists, URI allowlist (`https?|mailto|tel`), Preact `<RichText>` component using `dangerouslySetInnerHTML`, `patchExternalLinks()` post-sanitization helper with `useEffect` integration, image safety notes, and what DOMPurify removes by default.

### [`references/content-schema.md`](references/content-schema.md)
**Content type schemas** — Zod `ArticleSchema` with required image `alt`, `AuthorSchema`, `ProductSchema` with images minimum, `collectionSchema<T>` generic wrapper for paginated API responses, lazy `NavItemSchema` for recursive menus, and content model rules (required alt, coerce date, enum for status, `min(1)` vs `string()`).

### [`references/empty-error-states.md`](references/empty-error-states.md)
**Empty states and error pages** — `<EmptyState>` Preact component with `aria-labelledby`, action as href or onClick, usage examples, empty scenario table (search, first-use, permission, unavailable), `<NotFoundPage>` and `<ErrorPage>` components with structured nav, dev-only error details pattern.

## Testing focus

- CMS content renders correctly at various content lengths (short, long, empty).
- XSS vectors in CMS content are sanitized correctly.
- Empty states appear when collections are empty, not loading skeletons stuck indefinitely.
- External links have `noopener` and open in a new tab.
- Heading hierarchy is correct after CMS edits.
- 404 and 500 pages are reachable and styled correctly.

## External references

- [DOMPurify on GitHub](https://github.com/cure53/DOMPurify)
- [MDN: Content sectioning](https://developer.mozilla.org/en-US/docs/Web/HTML/Element#content_sectioning)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
