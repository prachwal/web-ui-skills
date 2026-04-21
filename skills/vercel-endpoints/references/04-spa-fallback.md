# SPA fallback and common traps

Always exclude API routes and static asset prefixes from SPA rewrites. A greedy rewrite will return HTML for API requests.

Example patterns used in real projects:

```json
{
    "rewrites": [
        { "source": "/api/(.*)", "destination": "/api/index.ts" },
        { "source": "/((?!assets/|api/|locales/|@vite/|@react-refresh|node_modules/|src/).*)", "destination": "/index.html" }
    ]
}
```

Common issues:

- A greedy rewrite that omits `api/` will cause `/api/*` to return the SPA shell (HTML) instead of JSON — check deploy logs and `curl` the `/api/*` endpoints directly.
- Ensure `vercel dev` and production rewrites behave the same; some deployment differences can appear between dev and prod.
