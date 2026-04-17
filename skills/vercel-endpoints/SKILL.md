---
name: vercel-endpoints
description: Use when creating or reviewing Vercel API endpoints, route handlers, or SPA fallback routing in a Vercel-deployed app built with Bun + TypeScript on dev side and Vercel Functions + TypeScript on server side. Covers function file placement, Web Request/Response handlers, Bun runtime configuration, SPA rewrites that exclude `/api/*`, local development with `vercel dev`, and deployment debugging.
---

# Vercel Endpoints (Bun + TypeScript + Vercel Functions)

Use this skill when building a Vercel-hosted app that ships:

- **Client**: Bun + TypeScript (Vite, plain HTML, or any SPA bundler run by Bun).
- **Server**: Vercel Functions written in TypeScript under `/api`, executed on Vercel's **Bun runtime** (Public Beta since Oct 2025, configured via `bunVersion` in `vercel.json`).

> This skill is a router. Read the section relevant to your task and jump into the referenced file for full detail.

---

## 1. Quick decision tree

| Situation | Go to |
|---|---|
| Set up a new project from scratch | [`references/01-project-setup.md`](references/01-project-setup.md) |
| Write or review a function handler | [`references/02-handlers.md`](references/02-handlers.md) |
| Configure `vercel.json` (runtime, rewrites, headers) | [`references/03-vercel-json.md`](references/03-vercel-json.md) |
| SPA fallback is eating `/api/*` requests | [`references/04-spa-fallback.md`](references/04-spa-fallback.md) |
| Dynamic routes / path params | [`references/05-dynamic-routes.md`](references/05-dynamic-routes.md) |
| Local dev with `vercel dev` + Bun | [`references/06-local-dev.md`](references/06-local-dev.md) |
| Debug `FUNCTION_INVOCATION_FAILED`, `ERR_MODULE_NOT_FOUND`, HTML-instead-of-JSON | [`references/07-debugging.md`](references/07-debugging.md) |
| TypeScript config for `/api` + client | [`references/08-typescript.md`](references/08-typescript.md) |
| Copy-paste starter files | [`references/09-templates.md`](references/09-templates.md) |

---

## 2. Core rules (must-follow)

1. **Function files live under `/api`** at the project root. Every `.ts` file under `/api` becomes a Vercel Function. Do **not** put handlers in `src/`, `dist/`, or inside the SPA entrypoint.
2. **Use the Web Handler shape**: `export default { fetch(request: Request) { ... } }`. This is the Vercel-recommended signature and works identically on Node.js and Bun runtimes. See [`references/02-handlers.md`](references/02-handlers.md).
3. **Pin Bun runtime explicitly** in `vercel.json` with `"bunVersion": "1.x"`. Only `"1.x"` is valid — Vercel manages minor versions. See [`references/03-vercel-json.md`](references/03-vercel-json.md).
4. **SPA rewrites must exclude `/api/*`**. Use a negative-lookahead source like `"/((?!api/).*)"` so function routes are never rewritten to `index.html`. Full patterns and traps in [`references/04-spa-fallback.md`](references/04-spa-fallback.md).
5. **Return JSON via `Response.json(...)`** — not string bodies with manual `Content-Type`. Clients parsing JSON break silently otherwise.
6. **Keep handlers small**. Route-specific logic stays in the route file; shared code goes in a `lib/` or `api/_lib/` folder that bundles cleanly. Avoid helper indirection that confuses Vercel's bundler.
7. **Test deployed URLs directly**, not only `vercel dev`. Rewrites and bundling behave differently in dev vs. prod.
8. **Avoid `Bun.serve` inside functions** — it is not supported on Vercel Functions. Use the `fetch` export. Other Bun APIs (`Bun.sql`, `Bun.s3`, `Bun.password`, `Bun.file`) are fine.

---

## 3. Minimal working layout

```
my-app/
├── api/
│   ├── hello.ts              # GET /api/hello
│   ├── health.ts             # GET /api/health
│   └── users/
│       └── [id].ts           # GET /api/users/:id
├── src/                      # SPA source (Bun + TS)
│   ├── main.ts
│   └── index.html
├── dist/                     # Build output (served as static)
├── package.json
├── tsconfig.json
├── vercel.json
└── bun.lock
```

See [`references/09-templates.md`](references/09-templates.md) for the full starter.

---

## 4. `vercel.json` baseline for this stack

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x",
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- `bunVersion` turns on the Bun runtime for all functions under `/api`. Without it you get the Node.js runtime.
- `buildCommand` runs with Bun because Vercel detects `bun.lock` and uses `bun install`; the script itself calls your bundler (Vite, `bun build`, etc.).
- The rewrite source uses a **negative lookahead** on `api/` so `/api/hello` is never rewritten to `/index.html`. This is the single most common SPA+API bug.

Full breakdown in [`references/03-vercel-json.md`](references/03-vercel-json.md) and [`references/04-spa-fallback.md`](references/04-spa-fallback.md).

---

## 5. Minimal handler

```ts
// api/hello.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') ?? 'World';
    return Response.json({ message: `Hello ${name}!` });
  },
};
```

Alternative shape (named HTTP exports, also supported):

```ts
// api/hello.ts
export async function GET(request: Request): Promise<Response> {
  return Response.json({ ok: true });
}
```

Details, POST/PUT patterns, body parsing, streaming, and `waitUntil` in [`references/02-handlers.md`](references/02-handlers.md).

---

## 6. Routing sanity checks (run after every deploy)

- `curl https://<deploy>/api/hello` → JSON, status 200, `content-type: application/json`.
- `curl -I https://<deploy>/some-client-route` → 200 with `content-type: text/html` (SPA shell).
- `curl -I https://<deploy>/api/does-not-exist` → 404 from Vercel, **not** HTML.
- If `/api/...` returns HTML, your rewrite is too greedy — go to [`references/04-spa-fallback.md`](references/04-spa-fallback.md).
- If `/api/...` returns `FUNCTION_INVOCATION_FAILED`, check deploy logs per [`references/07-debugging.md`](references/07-debugging.md).

---

## 7. Scope

This skill **does not** cover:

- Next.js App Router (`app/api/.../route.ts`) — that uses a different handler shape and its own conventions.
- Edge runtime specifics (this stack targets the Bun runtime on Fluid Compute).
- Middleware (`middleware.ts`) — see Vercel's Routing Middleware docs separately.
- Database/auth providers — covered only as integration examples.

---

## 8. Sources

Primary Vercel docs consulted when authoring this skill:

- Vercel Functions overview — <https://vercel.com/docs/functions>
- Functions API reference — <https://vercel.com/docs/functions/functions-api-reference>
- Node.js runtime — <https://vercel.com/docs/functions/runtimes/node-js>
- Bun runtime — <https://vercel.com/docs/functions/runtimes/bun>
- Quickstart — <https://vercel.com/docs/functions/quickstart>
- `@vercel/functions` package — <https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package>
- `vercel.json` configuration — <https://vercel.com/docs/project-configuration>
- Rewrites — <https://vercel.com/docs/rewrites>
- Bun deployment guide — <https://bun.com/docs/guides/deployment/vercel>
- Bun runtime announcement — <https://vercel.com/blog/bun-runtime-on-vercel-functions>
