# Environment Variables

Patterns for managing build-time and runtime environment variables safely in Netlify deployments.

## Variable types and where they live

| Type | Prefix | Bundled into JS? | Access | Safe for secrets? |
|---|---|---|---|---|
| Public build-time | `VITE_` (or `PUBLIC_`) | Yes, in bundle | `import.meta.env.VITE_FOO` | No — visible to users |
| Private runtime | None | No | `Netlify.env.get("FOO")` in Functions | Yes — server side only |
| Private build-time | None | No (if not referenced) | `process.env.FOO` in `vite.config.ts` | Yes — build scripts only |

## Fail fast on missing secrets

In Netlify Functions, validate required env vars at module load time:

```ts
// netlify/functions/_lib/config.ts
function requireEnv(name: string): string {
  const value = Netlify.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret:   requireEnv("JWT_SECRET"),
  stripeKey:   requireEnv("STRIPE_SECRET_KEY"),
  siteUrl:     Netlify.env.get("URL") ?? "http://localhost:8888", // optional with fallback
} as const;
```

## Public variables in Vite

```ts
// vite.config.ts — expose only needed vars with VITE_ prefix
export default defineConfig({
  define: {
    // This is set at build time; the value is hardcoded into the bundle.
    // Never put secrets here.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
```

In source code:

```ts
const apiBase = import.meta.env.VITE_API_BASE_URL;
if (!apiBase) throw new Error("VITE_API_BASE_URL is not set");
```

## Netlify environment variable scopes

Set scope in the Netlify dashboard under **Site configuration → Environment variables**:

| Scope | When to use |
|---|---|
| **Builds** | Available during `npm run build`; injected into the bundle if prefixed `VITE_` |
| **Functions** | Available in Netlify Functions at runtime via `Netlify.env.get()` |
| **Runtime** | Edge Functions runtime |
| **All** | Available in all scopes — use only for non-sensitive values |

Secrets like database URLs and API keys must be scoped to **Functions** only, never **Builds**.

## Separate values per context

```
# .env.example — commit this file; never commit the actual .env
VITE_API_BASE_URL=https://api.example.com
# DATABASE_URL — set in Netlify dashboard, NOT here
# JWT_SECRET   — set in Netlify dashboard, NOT here
```

In `netlify.toml`, set environment-specific public values:

```toml
[context.production.environment]
  VITE_API_BASE_URL = "https://api.example.com"

[context.deploy-preview.environment]
  VITE_API_BASE_URL = "https://staging-api.example.com"

[context.branch-deploy.environment]
  VITE_API_BASE_URL = "https://staging-api.example.com"
```

## Secret rotation checklist

1. Set the new value in Netlify environment variables.
2. Trigger a new deploy — runtime env changes take effect only after redeploy.
3. Verify the function can connect with the new secret before revoking the old one.
4. Revoke the old secret in the provider dashboard.
5. Check logs for any failed starts or connection errors.

## CI/CD secrets (GitHub Actions)

```yaml
# .github/workflows/deploy.yml (excerpt)
env:
  # Only public values inline; secrets from GitHub encrypted secrets
  VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
  NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
  NETLIFY_SITE_ID:    ${{ secrets.NETLIFY_SITE_ID }}
```

Never pass `DATABASE_URL` or other backend secrets to the CI build step — the build should not need them, and exposing them in the build log is a security risk.
