---
name: netlify-serverless
description: Use when building, reviewing, or securing API endpoints and serverless functions on Netlify. Covers Netlify Functions, Edge Functions, scheduled functions, environment config, authentication, CORS, rate limiting, error handling, and deployment patterns.
---

# Netlify Serverless Skill

Use this skill when writing backend API logic that runs on Netlify's serverless infrastructure: Functions (Node.js), Edge Functions (Deno/V8), scheduled jobs, and background tasks.

## Core principles

1. Keep functions small and single-purpose — one endpoint per file.
2. Validate all inputs at the function boundary; never trust the client.
3. Return typed, predictable responses with correct HTTP status codes.
4. Use environment variables for all secrets — never hard-code them.
5. Handle errors explicitly; log enough context to debug, but never expose internals.
6. Design for cold starts: minimize imports, avoid heavy initialization at module scope.

## Workflow

1. Identify the operation: CRUD, auth, webhook, background job, or data transform.
2. Choose the function type: Function (stateless REST), Edge Function (low-latency, geo-aware), Scheduled (cron), or Background (long-running).
3. Define the request contract: method, path, query params, body schema.
4. Implement: validate input → call service/DB → return typed response.
5. Add CORS headers when the function is called from a browser.
6. Protect with auth (JWT or Netlify Identity) when the route is private.
7. Test locally with `netlify dev` before deploying.

## Directory layout

```
netlify/
  functions/
    api-products.ts       ← GET/POST /api/products
    api-products-[id].ts  ← GET/PUT/DELETE /api/products/:id
    auth-callback.ts      ← OAuth callback handler
    webhook-stripe.ts     ← Stripe webhook handler
  edge-functions/
    geo-redirect.ts       ← edge-level redirect by country
  scheduled/
    sync-catalog.ts       ← nightly catalog sync
netlify.toml              ← redirects, function config, env
```

## Function anatomy (TypeScript)

```ts
// netlify/functions/api-products.ts
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface ProductBody { name: string; price: number; }

const handler: Handler = async (event: HandlerEvent, _ctx: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body: ProductBody;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!body.name || typeof body.price !== 'number' || body.price < 0) {
    return { statusCode: 422, body: JSON.stringify({ error: 'Validation failed' }) };
  }

  // call service / DB …
  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: crypto.randomUUID(), ...body }),
  };
};

export { handler };
```

## CORS

Add CORS headers to every browser-callable function:

```ts
const CORS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

if (event.httpMethod === 'OPTIONS') {
  return { statusCode: 204, headers: CORS, body: '' };
}

// … handler logic …
return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
```

## Authentication (JWT)

```ts
import { verify } from 'jsonwebtoken';

function getUser(event: HandlerEvent) {
  const auth = event.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    return verify(auth.slice(7), process.env.JWT_SECRET!) as { sub: string; role: string };
  } catch {
    return null;
  }
}

// In handler:
const user = getUser(event);
if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
if (user.role !== 'admin') return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
```

## Environment variables

```toml
# netlify.toml
[build.environment]
  NODE_VERSION = "20"

[context.production.environment]
  API_BASE_URL = "https://api.example.com"

# Secrets: set via Netlify dashboard or CLI — never in netlify.toml
# netlify env:set JWT_SECRET "…"
```

```ts
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is not set');
```

## Routing with netlify.toml redirects

```toml
# Route /api/* to functions
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api-:splat"
  status = 200

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Edge Functions

Use for sub-10 ms latency requirements or geo/request-level logic:

```ts
// netlify/edge-functions/geo-redirect.ts
import type { Config, Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  const country = context.geo?.country?.code;
  if (country === 'PL') {
    return Response.redirect('https://pl.example.com' + new URL(request.url).pathname, 302);
  }
};

export const config: Config = { path: '/*' };
```

## Scheduled functions

```ts
// netlify/scheduled/sync-catalog.ts
import type { Config, ScheduledHandler } from '@netlify/functions';

const handler: ScheduledHandler = async () => {
  await syncProductCatalog();
};

export const config: Config = { schedule: '@daily' };
export { handler };
```

## Error handling pattern

```ts
function ok(data: unknown, status = 200) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

function fail(message: string, status: number) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: message }) };
}
```

## Performance

- Keep `import` statements minimal at the module level — every unused import adds cold-start time.
- Cache external connections (DB, Redis) at module scope so they survive across warm invocations.
- Use streaming responses (`response.body`) for large payloads in Edge Functions.
- Set `Cache-Control` headers on read-only GET responses to leverage CDN caching.
- Avoid synchronous `fs` and CPU-heavy blocking operations in the request path.

## Security checklist

- [ ] All secrets in env variables, never in code
- [ ] Input validated and sanitized before use
- [ ] Auth checked before any data access
- [ ] CORS restricted to known origins in production
- [ ] Webhook payloads verified with HMAC signature
- [ ] Rate limiting enforced (Netlify rate limit rules or a middleware token bucket)
- [ ] No stack traces or DB errors returned to client
- [ ] `Content-Type` set on every response

## References

- [references/functions.md](references/functions.md): function types, patterns, and request/response API
- [references/security.md](references/security.md): auth, input validation, CORS, webhook verification, rate limiting
- [references/patterns.md](references/patterns.md): shared helpers, error handling, caching, testing
