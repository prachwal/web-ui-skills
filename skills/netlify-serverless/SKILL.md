---
name: netlify-serverless
description: Use when choosing and operating Netlify's serverless execution primitives. Covers Functions, Edge Functions, Background and Scheduled Functions, runtime capabilities, routing primitives, and deployment-time constraints.
---

# Netlify Serverless Skill

Use this skill when deciding how backend logic should run on Netlify's serverless infrastructure: Functions, Edge Functions, Background Functions, and Scheduled Functions.

## Core principles

1. Prefer the current web-standard `Request`/`Response` API over the older Lambda compatibility shape.
2. Pick the execution primitive for the workload instead of forcing everything into synchronous Functions.
3. Keep each function or job narrowly scoped, with one route or task per file.
4. Use runtime-scoped environment variables for secrets. Do not treat `netlify.toml` as a secret store for functions.
5. Design for cold starts and regional execution: minimize module-scope work and keep shared state safe to reuse.
6. Keep API contract design and database rules in the companion skills.

## Choose the right primitive

- Use a synchronous Function for normal API requests that must answer immediately.
- Use `context.waitUntil()` for post-response work that should not block the client, such as telemetry, async audit logging, or fire-and-forget webhooks.
- Use a Background Function for jobs that can run asynchronously for up to 15 minutes. Netlify returns `202` immediately and retries on failure.
- Use a Scheduled Function for cron-style jobs that only run on published deploys and have a 30 second execution limit.
- Use an Edge Function for request rewriting, auth gates, personalization, geo logic, or low-latency work near the user. Keep CPU work extremely small because Edge Functions have a 50 ms CPU limit.

## Workflow

1. Identify whether the endpoint is synchronous, post-response, scheduled, or long-running.
2. Choose the primitive: synchronous Function, Edge Function, Background Function, or Scheduled Function.
3. Decide whether the route should use `config.path` or the default `/.netlify/functions/<name>` path.
4. Add only the platform-specific behavior needed for that primitive: path config, `waitUntil`, schedule, or edge context.
5. Keep request contracts and database rules in the dedicated companion skills.
6. Test locally with `netlify dev` and verify production-only behavior such as env vars, rate limiting, and scheduled jobs separately.

## Directory layout

```
netlify/
  functions/
    api-products.ts       ← GET/POST /api/products
    api-products-[id].ts  ← GET/PUT/DELETE /api/products/:id
    auth-callback.ts      ← OAuth callback handler
    webhook-stripe.ts     ← Stripe webhook handler
    sync-catalog-background.ts  ← long-running async job
    daily-summary.ts      ← scheduled job via `config.schedule`
  edge-functions/
    geo-redirect.ts       ← edge-level redirect by country
netlify.toml              ← redirects, function config, env
```

## Function anatomy (TypeScript)

```ts
// netlify/functions/api-products.ts
import type { Config, Context } from "@netlify/functions";

type ProductBody = { name: string; price: number };

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  let body: ProductBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validation, auth, and service-layer rules belong in companion API skills.
  context.waitUntil(logAudit(context.requestId, body.name));

  return Response.json({ id: crypto.randomUUID(), ...body }, { status: 201 });
};

export const config: Config = {
  path: "/api/products",
};

async function logAudit(requestId: string, productName: string) {
  console.log("audit", { requestId, productName });
}
```

## Request context

- Log `context.requestId` on every failure path so downstream logs can be correlated.
- Use `context.params`, `context.ip`, `context.geo`, and `context.site` where they materially affect behavior. Do not parse these values from raw headers when Netlify already provides them.
- In Edge Functions, use the edge `Context` object for site, server region, params, and `waitUntil`.
- Keep auth, CORS, and response-shape policy in the companion API or security skills.

## Environment variables

```toml
# netlify.toml
[build.environment]
  NODE_VERSION = "20"

# Runtime secrets for Functions are not read from netlify.toml.
# Set them in the Netlify UI, CLI, or API with Functions scope.
```

```ts
const secret = Netlify.env.get("JWT_SECRET");
if (!secret) throw new Error("JWT_SECRET is not set");
```

- For serverless Functions, read runtime env via `Netlify.env.get("KEY")`.
- For Edge Functions, use `Netlify.env.get("KEY")` for env access.
- Changes to function runtime env vars require a new build and deploy to take effect.
- Only a subset of Netlify read-only variables is available at runtime. If code depends on repo, branch, or deploy metadata, verify it is exposed in the current runtime first.
- Keep secrets and least-privilege policy in the companion security skills.

## Routing

- Prefer `export const config = { path: "/api/products/:id" }` for API routes instead of older redirect-based function routing.
- Use redirect rules only when you need URL rewriting behavior outside the function itself.
- Use named params from `context.params` and the standard `URL` API for query string parsing.

## Edge Functions

Use Edge Functions for request shaping, auth gates, geo personalization, and low-latency rewrites, not for heavy compute or relational query orchestration.

```ts
// netlify/edge-functions/geo-redirect.ts
import type { Config, Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const country = context.geo?.country?.code;
  if (country === "PL") {
    return Response.redirect("https://pl.example.com" + new URL(request.url).pathname, 302);
  }

  return context.next();
};

export const config: Config = { path: "/*" };
```

- Keep edge bundles small. Netlify documents a 20 MB compressed code size limit, 512 MB memory limit, and 50 ms CPU limit.
- `context.waitUntil()` is available in Edge Functions too, but that async work still counts against the CPU budget.
- Edge Functions can only rewrite to same-site URLs; use `fetch()` for external content.

## Background and Scheduled Functions

- Background Functions are defined by the `-background` suffix and are appropriate for long-running async work.
- Background invocations return `202` immediately and can run for up to 15 minutes.
- Scheduled Functions use `export const config = { schedule: "..." }`, do not expose a public URL, and have a 30 second execution limit.
- Scheduled Functions only run on published deploys, not on Deploy Previews or branch deploys.

```ts
// netlify/functions/sync-catalog-background.ts
export default async () => {
  await syncProductCatalog();
};
```

```ts
// netlify/functions/daily-summary.ts
import type { Config } from "@netlify/functions";

export default async () => {
  await syncProductCatalog();
};

export const config: Config = { schedule: "@daily" };
```

## Platform-only checklist

- [ ] Correct primitive chosen for the workload
- [ ] Route attached with `config.path` only when needed
- [ ] Edge-specific work stays within edge CPU and bundle limits
- [ ] Background work uses the `-background` suffix and tolerates retries
- [ ] Scheduled work uses `config.schedule` and does not rely on preview deploys
- [ ] Runtime env vars are scoped for Functions where needed
- [ ] Rate limiting configured at the Netlify project level for public and expensive routes
- [ ] `requestId` included in logs where useful

## References

Local reference files:
- [references/functions.md](references/functions.md): function types, request model, path params, local dev, toml config
- [references/security.md](references/security.md): auth, CORS, webhook HMAC, secrets, rate limiting
- [references/patterns.md](references/patterns.md): shared helpers, error handling, DB pooling, pagination, caching, tests

Netlify docs:
- [Get started with functions](https://docs.netlify.com/functions/get-started/)
- [Serverless Functions API reference](https://docs.netlify.com/build/functions/api/)
- [Environment variables and functions](https://docs.netlify.com/functions/environment-variables/)
- [Background Functions overview](https://docs.netlify.com/functions/background-functions/)
- [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)
- [Edge Functions API](https://docs.netlify.com/build/edge-functions/api/)
- [Edge Functions limits](https://docs.netlify.com/edge-functions/limits/)
- [Rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/)
