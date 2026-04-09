# Web UI Skills Bundle

This repository bundles Codex skills for building professional web applications.

## Included skills

- `preact-ui` - component architecture, MVVM, signals, forms, routing, and professional UI patterns
- `scss-system` - design tokens, mixins, architecture, responsive theming
- `web-accessibility-standards` - accessible HTML, ARIA, WCAG implementation
- `a11y-review` - accessibility audits and QA
- `web-performance` - Core Web Vitals, image optimization, bundle splitting
- `web-i18n` - internationalization, RTL, locale-aware formatting
- `web-testing` - Playwright E2E, component tests, visual regression, CI reporting
- `storybook-ui` - Storybook setup, stories, interaction tests, accessibility, visual testing
- `web-seo-metadata` - route metadata, canonical URLs, social previews, sitemaps, structured data
- `web-forms` - accessible forms, validation, async submit states, error handling, spam resistance
- `web-data-fetching` - loading/error/empty states, cancellation, retry, cache invalidation, typed API boundaries
- `web-observability` - frontend errors, analytics events, Core Web Vitals, privacy-safe telemetry
- `web-deployment` - env vars, preview deploys, redirects, cache headers, SPA fallback, CI checks
- `web-auth-ux` - login, MFA, session expiry, password reset, role/permission UI, secure token handling
- `web-privacy` - consent management, cookie banners, opt-in/opt-out, data minimization, PII handling
- `web-content` - CMS integration, rich text safety, empty states, error pages, content schema
- `web-pwa` - installability, service workers, offline support, push notifications, app manifest
- `web-design-review` - design token alignment, spacing/typography/color review, responsive and dark mode checks
- `web-security` - XSS, CSP, session management, security headers
- `netlify-serverless` - current Netlify Functions and Edge model, auth, CORS, rate limiting, deployment patterns
- `netlify-typescript-api` - TypeScript API structure, `Request`/`Response` handlers, validation, response contracts
- `netlify-database-security` - runtime env secrets, least privilege, storage choices, safe database access
- `netlify-api-performance` - cold starts, query efficiency, cache strategy, regional observability
- `mongodb-netlify` - MongoDB Atlas on Netlify, connection reuse, pooling, Stable API, query safety
- `neon-netlify` - Neon and Netlify DB on Netlify, pooled Postgres access, branching, migration-safe workflows

## Install

### npx (recommended)

Install skills for all supported tools at once:

```bash
npx web-ui-skills
```

Or target specific tools:

```bash
npx web-ui-skills --codex      # ~/.codex/skills
npx web-ui-skills --claude     # ~/.claude/skills
npx web-ui-skills --copilot    # ~/.copilot/skills
npx web-ui-skills --kilo       # ~/.kilocode/skills

npx web-ui-skills --codex --claude   # multiple tools at once
```

Additional options:

```bash
npx web-ui-skills --list   # show detected skills and structural warnings
npx web-ui-skills --help   # show help
```

### Shell script (legacy)

Run the installer from the repository root:

```bash
./install.sh
```

By default, skills are copied to `${CODEX_HOME:-$HOME/.codex}/skills`.

## Release publishing

This repo publishes to npm from GitHub Releases using Trusted Publishing. Configure `web-ui-skills` as a trusted publisher in npmjs.com with the GitHub Actions workflow filename `.github/workflows/npm-publish.yml`. Create a release with a tag that matches the package version, for example `v1.0.4`. The workflow validates that the release tag and `package.json` version match, upgrades npm to a Trusted Publishing-compatible version, then publishes without an npm token secret.

Releases are created automatically from `main` by `.github/workflows/release-on-main.yml`. Each push to `main` that is not already a release commit bumps the patch version, pushes the version commit and tag, creates a GitHub release, and dispatches the npm publish workflow with the new tag.

## Version prep

For a new release:

1. Bump `package.json` and `package-lock.json` together.
2. Keep the release notes focused on the skills bundle and installer changes.
3. Avoid adding secrets or registry credentials to the repository.
4. Let the automation handle the patch bump and release from `main`.

## Local test

```bash
CODEX_HOME=/tmp/web-ui-skills-test-home node bin/install.js --codex
CODEX_HOME=/tmp/web-ui-skills-test-home ./install.sh --codex
```

Run `npx web-ui-skills --list` to inspect the bundle without installing anything.

## Notes

- `web-accessibility-standards` covers implementation work.
- `a11y-review` covers audits and QA.
- `preact-ui`, `scss-system`, and `storybook-ui` cover component architecture, styling, and UI documentation.
- `web-performance`, `web-i18n`, `web-testing`, `web-security`, `web-seo-metadata`, `web-forms`, `web-data-fetching`, `web-observability`, and `web-deployment` cover production frontend concerns.
- `web-auth-ux`, `web-privacy`, `web-content`, `web-pwa`, and `web-design-review` cover specialized product and compliance workflows.
- `netlify-serverless`, the Netlify API skills, `mongodb-netlify`, and `neon-netlify` cover backend, database, and operational concerns.

## TODO

- Expand `web-auth-ux` with OAuth/OIDC provider integration patterns if social login becomes common.
- Add `web-state-management` if complex shared client state beyond signals and TanStack Query becomes a recurring need.
- Expand `web-pwa` with background sync and Workbox patterns if offline-first data becomes a requirement.
