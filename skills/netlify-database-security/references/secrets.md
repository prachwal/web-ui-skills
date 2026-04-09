# Secret Management

Loading env vars safely, failing closed, scope verification, and rotation workflow for Netlify Functions.

## Fail-fast secret loader

```ts
// netlify/functions/_lib/env.ts
function requireEnv(name: string): string {
  const value = Netlify.env.get(name);
  if (!value) {
    // Throw at function initialisation time, not per-request
    // This causes an immediate cold-start failure and a visible deploy error
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Module-level initialisation — fails on cold start if env is misconfigured
export const DATABASE_URL = requireEnv("DATABASE_URL");
export const JWT_SECRET   = requireEnv("JWT_SECRET");
export const API_KEY      = requireEnv("THIRD_PARTY_API_KEY");
```

## Netlify variable scope rules

| Variable declared in | Available at build time | Available at Function runtime |
|---|---|---|
| `netlify.toml [build.environment]` | ✅ | ❌ |
| UI: "All scopes" | ✅ | ✅ |
| UI: "Functions" scope only | ❌ | ✅ |
| Injected at deploy (API) | ❌ | ✅ if scoped correctly |

> `netlify.toml` env values are **not** injected into Function runtime. Variables that must be available at runtime must be set through the Netlify UI or API with Functions scope.

## Per-context values (production vs. preview)

Set distinct values per deployment context in the Netlify UI or via the Netlify CLI:

```bash
# Set a value only for the production context
netlify env:set DATABASE_URL "postgres://...prod..." --context production

# Set a value for all branch preview deploys
netlify env:set DATABASE_URL "postgres://...preview..." --context branch-deploy

# Verify which values are set
netlify env:list
```

## Secret rotation checklist

When rotating a database password, JWT secret, or API key:

1. Add the new value as a second env var (e.g. `DATABASE_URL_NEXT`) — keep the old one running.
2. Update the application code to use the new variable name.
3. Deploy and verify the new credential works.
4. Remove the old env var.
5. Redeploy to clear the old value from any warm function instances.
6. Confirm the old credential is revoked at the service provider.

> Runtime env changes in Netlify take effect on the **next deploy**. Warm invocations keep the old value until a new cold start.

## Blobs key naming security

```ts
// Bad — user-controlled key allows path traversal
const store = getStore("user-data");
await store.get(req.headers.get("user-id")!); // ← untrusted input as key

// Good — validate and namespace keys
const userId = requireValidUserId(req.headers.get("x-user-id"));
const store = getStore(`user:${userId}`);      // namespace prevents collision
```

## Rules

- Load secrets at module init with a fail-fast helper — never silently continue with a missing secret.
- Never put secrets in `netlify.toml`; they are committed to git and not available at runtime anyway.
- Scope secrets to Functions; do not use "All scopes" when only the runtime needs them.
- Rotate by adding the new value first, deploying, then removing the old value.
- Never log credential values — log the variable name only in diagnostics.
