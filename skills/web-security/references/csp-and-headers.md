# CSP and security headers

## Content Security Policy

A well-configured CSP is the most effective browser-enforced XSS mitigation.

### Recommended starting policy

```http
Content-Security-Policy:
  default-src 'self';
  script-src  'self';
  style-src   'self' 'unsafe-inline';
  img-src     'self' data: https:;
  font-src    'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri    'self';
  form-action 'self';
```

- Remove `'unsafe-inline'` and `'unsafe-eval'` where possible.
- Use `nonce-{random}` for inline scripts that cannot be moved to external files.
- Start in `Content-Security-Policy-Report-Only` mode to collect violations before enforcing.

### CSP via netlify.toml

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-ancestors 'none';"
    X-Content-Type-Options  = "nosniff"
    X-Frame-Options         = "DENY"
    Referrer-Policy         = "strict-origin-when-cross-origin"
    Permissions-Policy      = "camera=(), microphone=(), geolocation=()"
```

## Essential security headers

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Block clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `Permissions-Policy` | `camera=(), microphone=()` | Disable unused browser APIs |
| `Content-Security-Policy` | see above | Restrict resource loading |

## CSRF protection

Browsers send cookies on cross-site requests. Protect state-changing endpoints:

- Use `SameSite=Strict` or `SameSite=Lax` on session cookies.
- Use double-submit cookie pattern or synchronizer token for traditional form submissions.
- For API-only apps using `Authorization: Bearer`, CSRF is not applicable (not a cookie).
- Never perform state changes on GET requests.

## Clickjacking

```http
X-Frame-Options: DENY
# Or via CSP (preferred):
Content-Security-Policy: frame-ancestors 'none';
```

Use `frame-ancestors 'self'` if the app legitimately embeds itself in an iframe.

## Open redirects

```ts
const ALLOWED_HOSTS = new Set(['app.example.com', 'example.com']);

function safeRedirect(target: string, fallback: string): string {
  try {
    const url = new URL(target, window.location.origin);
    if (url.hostname !== window.location.hostname && !ALLOWED_HOSTS.has(url.hostname)) {
      return fallback;
    }
    return url.toString();
  } catch {
    return fallback;
  }
}
```

## Subresource Integrity (SRI)

For third-party scripts and styles loaded from CDN:

```html
<script
  src="https://cdn.example.com/lib.min.js"
  integrity="sha384-abc123..."
  crossorigin="anonymous"
></script>
```

Generate the hash with: `openssl dgst -sha384 -binary lib.min.js | openssl base64 -A`
