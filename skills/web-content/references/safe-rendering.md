# Safe HTML Rendering

Patterns for safely rendering CMS content and user-generating HTML without XSS risk.

## DOMPurify sanitization

Never inject raw CMS HTML. Always sanitize with an allowlist:

```ts
// src/lib/safe-html.ts
import DOMPurify from "dompurify";

// Allowlist of tags and attributes safe for body copy
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "a", "ul", "ol", "li",
  "h2", "h3", "h4", "h5",
  "blockquote", "code", "pre",
  "figure", "figcaption", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr",
];

const ALLOWED_ATTR = [
  "href", "title", "target", "rel",
  "src", "srcset", "alt", "width", "height", "loading",
  "id", "class",
  "colspan", "rowspan",
];

export function safeHtml(raw: string): string {
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Prevent mXSS by forcing a consistent parsing mode
    FORCE_BODY: false,
    // Strip data: and javascript: URIs
    ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i,
  });
}
```

In a Preact component:

```tsx
import { safeHtml } from "../lib/safe-html";

function RichText({ html }: { html: string }) {
  return (
    <div
      class="prose"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeHtml(html) }}
    />
  );
}
```

## External link safety

After DOMPurify, patch all external links to add `noopener noreferrer`:

```ts
// src/lib/patch-links.ts
export function patchExternalLinks(container: HTMLElement, siteOrigin = window.location.origin): void {
  container.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    try {
      const href = new URL(a.href, window.location.href);
      if (href.origin !== siteOrigin) {
        a.setAttribute("rel", "noopener noreferrer");
        a.setAttribute("target", "_blank");
      }
    } catch {
      // Relative URL or malformed href — leave as-is
    }
  });
}
```

Use with a `useEffect` after the rich text mounts:

```tsx
import { useEffect, useRef } from "preact/hooks";
import { patchExternalLinks } from "../lib/patch-links";

function RichText({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) patchExternalLinks(ref.current);
  }, [html]);

  return (
    <div
      ref={ref}
      class="prose"
      dangerouslySetInnerHTML={{ __html: safeHtml(html) }}
    />
  );
}
```

## Image safety in CMS content

CMS images that appear in the sanitized body should:

1. Always have `alt` text — enforce in the content schema (see `content-schema.md`).
2. Use `loading="lazy"` for images below the fold.
3. Be served from a trusted CDN domain — add the CDN origin to the CSP `img-src` directive.

If the CMS generates responsive `srcset`, add `srcset` to `ALLOWED_ATTR` but only after confirming the CMS cannot inject attacker-controlled origins.

## What DOMPurify removes by default

- `<script>` and inline `onclick`/`onmouseover`/etc.
- `<iframe>`, `<object>`, `<embed>`, `<link>`, `<style>`
- `javascript:`, `data:`, `vbscript:` URIs
- `<form>`, `<input>`, `<button>` (form injection)
- Comments that contain IE conditional code

Always review allowlists after upgrading DOMPurify — new rules may be needed as HTML evolves.
