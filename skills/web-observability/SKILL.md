---
name: web-observability
description: Use when adding or reviewing frontend observability, including error reporting, analytics events, Core Web Vitals collection, logging, privacy-safe telemetry, and release diagnostics.
---

# Web Observability Skill

Use this skill when a web app needs measurable production behavior, not just local test coverage.

## Core goals

- Capture user-impacting errors and performance regressions.
- Make analytics events meaningful, stable, and privacy-aware.
- Connect telemetry to route, release, environment, and feature context.
- Avoid collecting unnecessary personal data.

## Checklist

- [ ] Runtime errors are captured with route, release, and environment context.
- [ ] Unhandled promise rejections are captured.
- [ ] Core Web Vitals are reported from real users when performance matters.
- [ ] Analytics events use stable names and documented properties.
- [ ] Event schemas avoid personal data unless explicitly required and approved.
- [ ] Logs and telemetry redact tokens, secrets, and sensitive identifiers.
- [ ] Source maps are uploaded only to trusted observability systems.
- [ ] Preview, staging, and production telemetry are separated.
- [ ] Error boundaries or route-level fallbacks preserve a usable UI.
- [ ] Dashboards or alerts focus on actionable failures.

## Implementation rules

- Define event names and properties before instrumenting UI code.
- Instrument important product events near the state transition that proves they happened.
- Capture enough context to debug without logging raw payloads.
- Sample high-volume events where full fidelity is unnecessary.
- Keep observability SDKs out of the critical path where possible.
- Respect consent and privacy settings before loading tracking scripts.

## Testing focus

- Verify telemetry is disabled or separated in local/dev environments.
- Trigger representative errors and confirm they are captured.
- Confirm source maps resolve stack traces in the target environment.
- Check that sensitive form values and auth headers are not sent.
- Confirm Web Vitals reporting does not double-count SPA route transitions.

## Reference files

### [`references/error-reporting.md`](references/error-reporting.md)
**Runtime error capture** — Preact `ErrorBoundary` component with `componentDidCatch`, `reportError()` utility with dev/prod split and context sanitization, `unhandledrejection` global binding, async `withErrorReporting()` wrapper, source map upload and removal in CI. Start here for any error monitoring setup.

### [`references/analytics.md`](references/analytics.md)
**Typed analytics events** — `AnalyticsEvent` discriminated union, `track<N>()` with consent gate and dev bypass, SPA `page_view` deduplication, PII constraints table, hashed email pattern (server-side only), event naming conventions. Use this as the template for all product analytics instrumentation.

### [`references/vitals.md`](references/vitals.md)
**Core Web Vitals collection** — `web-vitals` setup with all five metrics (CLS, FCP, INP, LCP, TTFB), `sendBeacon` with `fetch keepalive` fallback, Netlify Functions ingestion endpoint, SPA route transition handling, thresholds reference table, alerting guidance. Use when real-user performance measurement is required.

## External references

- [web.dev: Core Web Vitals](https://web.dev/articles/vitals)
- [web-vitals npm package](https://github.com/GoogleChrome/web-vitals)
- [MDN: Reporting API](https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API)
