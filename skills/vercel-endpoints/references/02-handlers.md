# Function handlers — practical guidance

Handler shapes supported on Vercel (Node.js and Bun runtimes):

- Default web-handler export (works on both runtimes):

```ts
export default {
 async fetch(request: Request): Promise<Response> {
  // handler logic
  return Response.json({ ok: true });
 },
};
```

- Named HTTP handlers (also supported):

```ts
export async function GET(request: Request) { return Response.json({ ok: true }); }
```

Best practices:

- Return JSON using `Response.json(...)` to ensure correct `Content-Type` and consistent parsing on clients.
- Keep each function file small and focused — route-specific logic in the route file, shared utilities in a small `lib/` or `utils/` folder that is emitted into the function bundle.
- When using TypeScript + bundlers, verify emitted helper modules are included in the function bundle; runtime `ERR_MODULE_NOT_FOUND` often indicates the helper wasn't emitted or the import path differs (use `.js` in runtime imports if necessary).
- Avoid using `Bun.serve` inside functions — use the `fetch` export.
- For handlers that parse bodies, use `await request.json()` and always guard with try/catch for malformed input.

Examples and edge cases:

- Streaming responses: prefer the `Response` streaming API when returning large payloads.
- Authentication: validate tokens early and return proper 401/403 responses; keep secrets out of client-side `VITE_` variables.
