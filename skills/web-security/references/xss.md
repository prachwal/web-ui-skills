# XSS prevention

## The framework is your first defence

Preact and React escape string values in JSX by default. Never bypass this.

```tsx
// Safe — Preact escapes the value
<p>{userInput}</p>

// Dangerous — bypasses escaping
<p dangerouslySetInnerHTML={{ __html: userInput }} />
```

## When `innerHTML` is unavoidable

Sanitize with DOMPurify before any `innerHTML` assignment:

```ts
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(rawHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br'],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  ALLOWED_URI_REGEXP: /^https?:/i,
});
element.innerHTML = clean;
```

## Dangerous sinks to audit

| Sink | Risk |
|---|---|
| `element.innerHTML = x` | XSS |
| `element.outerHTML = x` | XSS |
| `document.write(x)` | XSS |
| `eval(x)` / `new Function(x)` | code injection |
| `setTimeout(x, n)` when x is a string | code injection |
| `<a href={x}>` when x is user-supplied | `javascript:` injection |
| `<script src={x}>` | script injection |

## URL sanitization

```ts
function safeHref(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '#';
    return parsed.toString();
  } catch {
    return '#';
  }
}

// Usage:
<a href={safeHref(userSuppliedUrl)}>Link</a>
```

## Trusted Types (CSP integration)

Where supported, use Trusted Types to enforce sanitization at the platform level:

```ts
if (window.trustedTypes?.createPolicy) {
  const policy = window.trustedTypes.createPolicy('default', {
    createHTML: (input: string) => DOMPurify.sanitize(input),
  });
  element.innerHTML = policy.createHTML(rawHtml) as unknown as string;
}
```

## Content from CMS, Markdown, or user profiles

- Treat all CMS HTML output as untrusted — sanitize before rendering.
- Parse Markdown to a safe AST (e.g. `remark` + `rehype-sanitize`) and render the AST, not raw HTML.
- Never assume a `data-*` attribute from an external source is safe in a `setAttribute` call.
- Strip or encode angle brackets and quotes from user display names before inserting into templates.

## Rules

- Never use `eval`, `Function()`, or `setTimeout(string)`.
- Sanitize all `innerHTML` assignments with DOMPurify.
- Validate URL schemes before use in `href`, `src`, or CSS `url()`.
- Escape user content in error messages, log lines, and analytics payloads.
- Review dependencies: a package that calls `innerHTML` internally may introduce XSS.
