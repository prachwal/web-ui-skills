# Safe Data Handling

Patterns for stripping PII from URLs, redacting sensitive fields from logs, and handling storage safely.

## Strip PII from URLs

Magic link tokens, pre-filled emails, and invite codes in query params must be consumed and cleared immediately:

```ts
// src/lib/url-privacy.ts

/**
 * Remove named query parameters from the current URL and update browser history.
 * Call after consuming a sensitive param (token, email, invite code).
 */
export function stripParamsFromUrl(params: string[]): void {
  const url = new URL(window.location.href);
  let changed = false;

  for (const param of params) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }

  if (changed) {
    // Replace history — back button will not re-expose the token
    history.replaceState(null, "", url.toString());
  }
}

// After consuming a magic-link token:
const token = new URLSearchParams(window.location.search).get("token");
if (token) {
  await consumeToken(token);
  stripParamsFromUrl(["token", "email", "invite", "ref"]);
}
```

## Redact sensitive fields from logs

Before logging or sending an object to an observability service, redact known sensitive keys:

```ts
// src/lib/redact.ts

const SENSITIVE_KEYS = new Set([
  "password", "passwd", "secret", "token", "access_token",
  "refresh_token", "authorization", "cookie", "session",
  "email", "ssn", "credit_card", "card_number",
  "api_key", "private_key",
]);

type PlainObject = Record<string, unknown>;

export function redactForLog(
  obj: PlainObject,
  replacement = "[redacted]",
): PlainObject {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) return [k, replacement];
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        return [k, redactForLog(v as PlainObject, replacement)];
      }
      return [k, v];
    }),
  );
}

// Usage in error logger:
reportError(error, redactForLog({ userId, email, action, metadata }));
```

## Storage safety guide

```ts
// ✓ Safe to store in localStorage
localStorage.setItem("theme", "dark");
localStorage.setItem("language", "pl");
localStorage.setItem("onboarding-dismissed", "1");

// ✗ Never store in localStorage
// localStorage.setItem("auth_token", token);    // Use HttpOnly cookie instead
// localStorage.setItem("password", password);   // Never store
// localStorage.setItem("session_id", id);       // Use HttpOnly cookie

// ✓ Safe to store in sessionStorage (cleared on tab close)
sessionStorage.setItem("checkout-step", "2");
sessionStorage.setItem("form-draft-address", JSON.stringify(draft));

// ✗ Avoid in sessionStorage
// sessionStorage.setItem("auth_token", token);  // Use cookie
```

## Hash PII server-side before analytics

If a business requirement needs user identity in analytics (e.g. cross-device tracking), hash on the server — never in the browser:

```ts
// netlify/functions/_lib/hash-id.ts
import { createHash } from "crypto";

/**
 * One-way hash for anonymous user identification in analytics.
 * Include a site-specific salt to prevent rainbow table attacks.
 */
export function anonymizeId(rawId: string, salt: string): string {
  return createHash("sha256")
    .update(salt)
    .update(rawId.toLowerCase().trim())
    .digest("hex")
    .slice(0, 16); // 16 hex chars = 64-bit identifier, sufficient for analytics
}
```

Never send the raw email or user ID to analytics from client-side code.

## Source map access control

Source maps in production reveal your original source; restrict access:

1. Delete `.map` files from the deployed bundle after uploading to your error monitoring service:

```bash
find dist/assets -name "*.map" -delete
```

2. Or, generate source maps to a private bucket only:

```ts
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: process.env.CI ? "hidden" : true,
    // "hidden" generates maps but does not emit //# sourceMappingURL comment in JS
  },
});
```

3. Add source map access to `robots.txt` Disallow and `.htaccess`/Netlify headers if they are saved in the publish dir.
