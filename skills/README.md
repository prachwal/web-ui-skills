# Web Skills Map

Repository-local guidance for building TypeScript web apps, frontend workflows, and Netlify-backed APIs.

## Foundation

- `typescript-fundamentals` for TypeScript patterns, type design, naming, JSDoc, formatting, and module structure.
- `eslint-config` for flat config setup, rule selection, and framework-specific presets.

## Frontend workflow

- `preact-ui` for Preact component structure, state, routing, data fetching, forms, and tests.
- `scss-system` for design tokens, component styles, theming, and Sass architecture.
- `storybook-ui` for component docs, story-driven development, interaction tests, accessibility checks, and visual regression workflows.
- `web-accessibility-standards` for accessible implementation and `a11y-review` for audits.
- `web-performance` for loading speed, Core Web Vitals, responsive loading, and image optimization.
- `web-i18n` for locale-aware formatting, language tags, pluralization, and RTL.
- `web-testing` for Playwright E2E, regression, browser compatibility, progressive enhancement, and CI reporting.
- `web-security` for XSS, CSP, token storage, secure links, and frontend security checks.
- `web-seo-metadata` for route metadata, canonical URLs, social previews, sitemaps, and structured data.
- `web-forms` for accessible forms, validation, async submit states, errors, and spam resistance.
- `web-data-fetching` for loading/error/empty states, cancellation, retry, cache invalidation, and typed API boundaries.
- `web-observability` for frontend errors, analytics events, Core Web Vitals, and privacy-safe telemetry.
- `web-deployment` for env vars, preview deploys, redirects, cache headers, SPA fallback, and CI release checks.
- `vercel-endpoints` for Vercel API routes, function handlers, SPA rewrite exclusions, and endpoint debugging.
- `web-auth-ux` for login, MFA, session expiry, password reset, and role/permission UI flows.
- `web-privacy` for consent, cookie banners, opt-in/opt-out analytics, PII handling, and compliance-aware patterns.
- `web-content` for CMS integration, rich text safety, empty states, error pages, and content schema.
- `web-pwa` for installability, service workers, offline support, background sync, and push notifications.
- `web-design-review` for design token alignment, spacing/typography/color audits, responsive and dark mode checks.

## Backend API workflow

- `netlify-serverless` for execution-model choice: Functions, Edge, Background, and Scheduled.
- `netlify-typescript-api` for handler architecture, validation boundaries, and response contracts.
- `netlify-database-security` for secrets, least privilege, and persistence rules.
- `netlify-api-performance` for latency, caching, and observability tuning.
- `mongodb-netlify` for MongoDB-specific connection and query behavior on Netlify.
- `neon-netlify` for Neon or Netlify DB connection strategy, branching, and Postgres-specific workflows.

These are written as reusable working notes for Codex and future contributors.
