# CI Deployment Pipeline

CI gates and deployment workflow for frontend web apps using GitHub Actions and Netlify.

## Full pipeline (GitHub Actions → Netlify)

```yaml
# .github/workflows/deploy.yml
name: CI / Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test -- --reporter=dot

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL_STAGING }}

  e2e:
    name: E2E tests
    runs-on: ubuntu-latest
    needs: quality
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: ${{ needs.quality.outputs.preview_url }}

  deploy-preview:
    name: Deploy preview
    runs-on: ubuntu-latest
    needs: quality
    if: github.event_name == 'pull_request'
    outputs:
      preview_url: ${{ steps.deploy.outputs.NETLIFY_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL_STAGING }}
      - name: Deploy to Netlify (preview)
        id: deploy
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: dist
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Preview: ${{ github.event.pull_request.title }}"
          enable-commit-comment: true
          enable-pull-request-comment: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID:    ${{ secrets.NETLIFY_SITE_ID }}

  deploy-production:
    name: Deploy production
    runs-on: ubuntu-latest
    needs: quality
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL_PRODUCTION }}
      - name: Deploy to Netlify (production)
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: dist
          production-branch: main
          production-deploy: true
          deploy-message: "Production: ${{ github.sha }}"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID:    ${{ secrets.NETLIFY_SITE_ID }}
```

## Minimum required npm scripts

```json
{
  "scripts": {
    "build":     "vite build",
    "typecheck": "tsc --noEmit",
    "lint":      "eslint src --max-warnings 0",
    "test":      "vitest run",
    "test:e2e":  "playwright test"
  }
}
```

Use `--max-warnings 0` on lint so warnings block the pipeline. All lint issues must be resolved or disabled with a comment justification.

## Pre-deploy checklist

Run before promoting a preview to production:

```bash
# Verify build output
ls -la dist/
# Should contain: index.html, assets/ (with hashed filenames), 404.html

# Verify the bundle does not contain secrets
grep -r "DATABASE_URL\|JWT_SECRET\|STRIPE_SECRET" dist/ && echo "⚠ Secret found in bundle!" || echo "✓ No secrets in bundle"

# Verify service worker is present if PWA
test -f dist/sw.js && echo "✓ SW present" || echo "⚠ SW missing"
```

## Post-deploy smoke checks

```ts
// scripts/smoke-check.ts — run after each deploy
const ROUTES = ["/", "/about", "/products", "/non-existent-page"];

for (const route of ROUTES) {
  const res = await fetch(`${process.env.DEPLOY_URL}${route}`);
  console.assert(res.ok || res.status === 404, `Route ${route} returned ${res.status}`);
  
  const contentType = res.headers.get("Content-Type") ?? "";
  console.assert(contentType.includes("text/html"), `Route ${route} returned wrong Content-Type`);
}
```

## Release metadata

Tag deployments with identifiable metadata:

```ts
// src/lib/version.ts
export const buildInfo = {
  version: import.meta.env.VITE_APP_VERSION ?? "dev",
  commitSha: import.meta.env.VITE_COMMIT_SHA ?? "local",
  buildTime: import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString(),
} as const;
```

Set in CI:

```yaml
env:
  VITE_APP_VERSION:  ${{ github.ref_name }}
  VITE_COMMIT_SHA:   ${{ github.sha }}
  VITE_BUILD_TIME:   ${{ github.event.head_commit.timestamp }}
```
