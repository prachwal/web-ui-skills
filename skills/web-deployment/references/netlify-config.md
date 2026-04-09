# Netlify Deployment Configuration

Complete `netlify.toml` for a Preact/Vite SPA with Netlify Functions.

## Full netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

# SPA client-side routing fallback
# This must come BEFORE any specific rewrites; Netlify applies the first match.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = { Language = [] }
  # Only rewrite requests that are not real files, API routes, or the 200.html itself
  # Netlify automatically skips existing files for status 200 rewrites.

# Canonical www → apex (or apex → www), choose one direction
[[redirects]]
  from = "https://www.example.com/*"
  to   = "https://example.com/:splat"
  status = 301
  force = true

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS    = "--legacy-peer-deps"

# Default security headers for all routes
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options        = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy        = "strict-origin-when-cross-origin"
    Permissions-Policy     = "camera=(), microphone=(), geolocation=()"

# Immutable caching for fingerprinted assets (Vite hashes filenames)
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# No caching for the HTML shell and service worker
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

# API functions — never cache responses at the CDN level by default
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-store"
```

## Preview deploy: block search indexing

Add an `X-Robots-Tag: noindex` header on preview deploys using a Netlify Edge Function or a context-aware header:

```toml
# netlify.toml additions for preview context
[context.deploy-preview.headers]
  for = "/*"
  X-Robots-Tag = "noindex, nofollow"
```

Or use a Netlify Edge Function for finer control:

```ts
// netlify/edge-functions/noindex-preview.ts
import type { Config, Context } from "@netlify/edge-functions";

export default async (_req: Request, context: Context): Promise<Response> => {
  const res = await context.next();
  const cloned = new Response(res.body, res);
  cloned.headers.set("X-Robots-Tag", "noindex, nofollow");
  return cloned;
};

export const config: Config = {
  path: "/*",
  // Only active on deploy previews (Netlify context)
  excludedPath: ["/api/*"],
};
```

## Custom 404 handling

Create `dist/404.html` (or `public/404.html`) so the CDN serves the branded page:

```html
<!-- public/404.html — served by Netlify for real missing resources -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Page not found | Acme</title>
    <meta name="robots" content="noindex" />
  </head>
  <body>
    <h1>Page not found</h1>
    <p><a href="/">Return to home</a></p>
  </body>
</html>
```

The SPA fallback (`/* → /index.html, 200`) handles unknown client routes. The `404.html` handles genuinely missing static files and broken asset paths.

## CORS headers for API routes

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin  = "https://example.com"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Access-Control-Max-Age       = "86400"
```

For dev, avoid `*` in production. Set the exact origin or use function-level CORS logic.
