# Netlify Functions reference

## Function types

| Type | Runtime | Use case |
|---|---|---|
| Synchronous Function | Node.js configured for the site, minimum 18 | REST API, auth, webhooks |
| Background Function | Node.js configured for the site, minimum 18 | Long tasks (up to 15 min) |
| Scheduled Function | Node.js configured for the site, minimum 18 | Cron jobs |
| Edge Function | Deno / V8 | Sub-10 ms, geo, A/B, redirects |

## Request model (`Request` + `Context`)

```ts
interface Context {
  params: Record<string, string>;
  requestId: string;
  ip?: string;
  geo?: {
    city?: string;
    country?: { code?: string; name?: string };
  };
}
```

Use the standard Web APIs:

```ts
req.method;
req.headers.get("authorization");
await req.json();
new URL(req.url).searchParams.get("page");
Response.json({ ok: true }, { status: 200 });
```

## Parsing and dispatching by method

```ts
export default async (req: Request) => {
  switch (req.method) {
    case "GET":
      return handleGet(req);
    case "POST":
      return handlePost(req);
    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
};
```

## Query parameters

```ts
const url = new URL(req.url);
const page = url.searchParams.get("page") ?? "1";
const limit = url.searchParams.get("limit") ?? "20";
const pageNum = Math.max(1, parseInt(page, 10));
const limitNum = Math.min(100, parseInt(limit, 10));
```

## Body parsing

```ts
async function parseBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("Invalid JSON");
  }
}
```

## Path parameters via `config.path`

```ts
import type { Config, Context } from "@netlify/functions";

export default async (_req: Request, context: Context) => {
  const id = context.params.id;
  return Response.json({ id });
};

export const config: Config = {
  path: "/api/products/:id",
};
```

## Context and identity

```ts
// netlify/functions/hello.ts
import type { Context } from "@netlify/functions";

export default async (_req: Request, context: Context) => {
  console.log(context.requestId, context.ip, context.params);
  return new Response("ok");
};
```

## Background functions

Respond immediately, then do heavy work:

```ts
// netlify/functions/generate-report-background.ts
export default async (req: Request) => {
  const { reportId } = await req.json();
  await buildAndStoreReport(reportId); // runs up to 15 min
};
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
