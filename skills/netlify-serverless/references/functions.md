# Netlify Functions reference

## Function types

| Type | Runtime | Use case |
|---|---|---|
| Synchronous Function | Node.js 20 | REST API, auth, webhooks |
| Background Function | Node.js 20 | Long tasks (up to 15 min) |
| Scheduled Function | Node.js 20 | Cron jobs |
| Edge Function | Deno / V8 | Sub-10 ms, geo, A/B, redirects |

## Request model (HandlerEvent)

```ts
interface HandlerEvent {
  httpMethod: string;           // 'GET' | 'POST' | …
  path: string;                 // '/api/products'
  queryStringParameters: Record<string, string> | null;
  multiValueQueryStringParameters: Record<string, string[]> | null;
  headers: Record<string, string>;
  body: string | null;          // JSON string or form-encoded
  isBase64Encoded: boolean;
}
```

## Response model

```ts
interface HandlerResponse {
  statusCode: number;
  headers?: Record<string, string>;
  multiValueHeaders?: Record<string, string[]>;
  body?: string;
  isBase64Encoded?: boolean;
}
```

## Parsing and dispatching by method

```ts
const handler: Handler = async (event) => {
  switch (event.httpMethod) {
    case 'GET':  return handleGet(event);
    case 'POST': return handlePost(event);
    default:     return { statusCode: 405, body: 'Method Not Allowed' };
  }
};
```

## Query parameters

```ts
const { page = '1', limit = '20' } = event.queryStringParameters ?? {};
const pageNum = Math.max(1, parseInt(page, 10));
const limitNum = Math.min(100, parseInt(limit, 10));
```

## Body parsing

```ts
function parseBody<T>(event: HandlerEvent): T {
  if (!event.body) throw new Error('Empty body');
  try {
    return JSON.parse(
      event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString()
        : event.body
    ) as T;
  } catch {
    throw new Error('Invalid JSON');
  }
}
```

## Path parameters via netlify.toml

```toml
# Expose :id from /api/products/:id
[[redirects]]
  from = "/api/products/:id"
  to = "/.netlify/functions/api-product-detail"
  status = 200
```

```ts
// Read from queryStringParameters (Netlify injects splat params there)
const id = event.queryStringParameters?.id;
```

## Context and identity

```ts
// netlify/functions/hello.ts
const handler: Handler = async (_event, context) => {
  const { identity, user } = context.clientContext ?? {};
  // identity.token — JWT for Netlify Identity
  // user — decoded user object when Netlify Identity is active
};
```

## Background functions

Respond immediately, then do heavy work:

```ts
// netlify/functions/generate-report-background.ts
import type { BackgroundHandler } from '@netlify/functions';

const handler: BackgroundHandler = async (event) => {
  const { reportId } = JSON.parse(event.body ?? '{}');
  await buildAndStoreReport(reportId); // runs up to 15 min
};

export { handler };
```

Invoke with a `POST`; Netlify returns `202 Accepted` immediately.

## Local development

```bash
npm install -g netlify-cli
netlify dev          # starts functions + Vite dev server with env injection
netlify functions:invoke api-products --payload '{"name":"Widget","price":9.99}'
```

## netlify.toml essentials

```toml
[build]
  command   = "npm run build"
  publish   = "dist"
  functions = "netlify/functions"

[dev]
  command   = "npm run dev"
  port      = 8888
  targetPort = 5173

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-store"
    X-Content-Type-Options = "nosniff"
```
