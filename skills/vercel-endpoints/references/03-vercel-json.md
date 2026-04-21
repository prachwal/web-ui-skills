# `vercel.json` examples and notes

A typical `vercel.json` for SPA + Functions (Bun runtime) includes runtime hints, build commands, rewrites and caching headers.

Example (practical):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.ts" },
    { "source": "/((?!assets/|api/|locales/|@vite/|@react-refresh|node_modules/|src/).*)", "destination": "/index.html" }
  ],
  "headers": [ { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] } ]
}
```

Notes:

- `bunVersion` enables the Bun runtime for functions — pin to `1.x` where appropriate.
- `rewrites` should ensure API routes are not rewritten to the SPA shell. Use a negative lookahead or explicit `api/` first rule as shown.
- The rewrite that excludes `api/` is the single most common cause of client requests returning HTML instead of JSON.
- Set Cache-Control headers for static assets (`/assets/*`) to enable long-term caching.
- Use `installCommand` when your environment requires a specific package manager command (eg. `pnpm install`).

Verification:

- After changes, run `pnpm build` and verify the produced `dist/` contains expected static files.
- Test deployed routes directly to validate rewrites and function behavior.
