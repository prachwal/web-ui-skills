---
name: web-deployment
description: Use when preparing frontend web apps for deployment, including environment variables, preview deploys, redirects, cache headers, SPA fallback, static assets, CI gates, and release checks.
---

# Web Deployment Skill

Use this skill when moving a frontend web app from local development to preview, staging, or production.

## Core goals

- Make deployed behavior match local expectations.
- Keep environment variables, redirects, and cache headers explicit.
- Prevent stale assets, broken SPA routes, and accidental preview indexing.
- Run the right checks before promotion.

## Checklist

- [ ] Build command and output directory are documented.
- [ ] Public environment variables are prefixed and safe for client exposure.
- [ ] Secrets are not bundled into frontend code.
- [ ] Preview and production environment values are separated.
- [ ] SPA fallback routes are configured when client routing needs them.
- [ ] Deep links to every public client route work after a fresh browser load.
- [ ] Fallback rules do not rewrite static assets, API routes, or real 404s into the app shell.
- [ ] Redirects and rewrites are tested for canonical URLs and API paths.
- [ ] Static assets use long-lived immutable caching when fingerprinted.
- [ ] HTML and route shell responses avoid stale long-lived caching.
- [ ] `robots` behavior prevents indexing preview deployments.
- [ ] CI runs typecheck, lint, tests, and production build before deploy.
- [ ] Release notes or deploy metadata identify the shipped version.

## Implementation rules

- Treat client-side environment variables as public.
- Keep cache headers close to the hosting config.
- Use immutable caching only for content-addressed assets.
- Verify fallback routing does not mask real 404s for assets or APIs.
- Keep host-level redirects aligned with client route definitions and route metadata.
- Use preview deploys for stakeholder review, not as production-like security boundaries.
- Keep deployment checks fast enough to run on every pull request.

## Testing focus

- Fresh browser visit and hard refresh after deployment.
- Deep-link navigation to client routes.
- Unknown route behavior: real 404 where appropriate, app-level 404 for client routes.
- Asset caching across deploys.
- Preview deploy indexing and canonical URL behavior.
- Environment-specific API URLs and feature flags.
- Rollback or redeploy behavior.

## References

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [MDN: Redirections in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections)
- [Netlify redirects and rewrites](https://docs.netlify.com/routing/redirects/)
- [Netlify environment variables](https://docs.netlify.com/build/configure-builds/environment-variables/)
- [Netlify headers](https://docs.netlify.com/routing/headers/)
