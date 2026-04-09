---
name: web-privacy
description: Use when implementing or reviewing consent management, cookie banners, analytics opt-in/out, tracking controls, data minimization, privacy-safe telemetry, and compliance-aware frontend patterns.
---

# Web Privacy Skill

Use this skill when a web app collects, stores, or transmits user data, uses analytics or tracking scripts, or must comply with privacy regulations such as GDPR or CCPA.

## Core goals

- Collect only data the product actually needs for a documented purpose.
- Obtain and respect consent before loading tracking or analytics scripts.
- Give users meaningful controls and honor their choices immediately.
- Keep privacy decisions close to the implementation that acts on them.

## Checklist

- [ ] Analytics and tracking scripts are not loaded before consent is given.
- [ ] Consent is stored persistently (cookie or `localStorage`) and re-checked on each page load.
- [ ] A consent banner or preference center is shown to new visitors before tracking fires.
- [ ] Users can withdraw consent and tracking stops immediately without a full page reload.
- [ ] Functional cookies (session, auth) are treated separately from analytics/tracking cookies.
- [ ] Cookie banner does not use dark patterns: reject must be as easy as accept.
- [ ] `localStorage` and `sessionStorage` do not contain tokens, PII, or sensitive query params.
- [ ] URL query params with PII (e.g. email in magic link tokens) are stripped after use.
- [ ] Source maps uploaded to observability systems are access-controlled.
- [ ] Forms do not send sensitive data in GET parameters.
- [ ] Privacy policy URL is linked from the consent banner and any form that collects personal data.

## Reference files

### [`references/consent.md`](references/consent.md)
**Consent management** — `ConsentState` typed with `version` for re-consent on policy changes, `getConsent`/`setConsent`/`revokeConsent` with `localStorage`, `shouldShowConsentBanner()` version check, Preact `<ConsentBanner>` with equal reject/accept prominence, `<ConsentPreferences>` granular checkboxes, functional-cookie exclusion pattern.

### [`references/script-loading.md`](references/script-loading.md)
**Conditional script loading** — `loadAnalytics`/`unloadAnalytics` with script injection and cookie clearing, page-load initialization order, CSP `script-src` allowlist in `netlify.toml`, privacy-first Plausible alternative, PostHog with `persistence: "memory"` and `autocapture: false`. Use when tracking scripts must be loaded only after consent.

### [`references/data-handling.md`](references/data-handling.md)
**Safe data patterns** — `stripParamsFromUrl()` with `history.replaceState` to remove tokens and emails from URLs, `redactForLog()` with nested object support, storage safety guide (what belongs where), server-side `anonymizeId()` hashing pattern, Vite `sourcemap: "hidden"` + post-build `.map` deletion for source map access control.

## Testing focus

- Tracking scripts do not fire before consent is given.
- Revoking consent stops tracking immediately without requiring a reload.
- Reject/decline path is functional and equal to accept.
- PII is not present in URLs, logs, or `localStorage` after the relevant flow.
- Cookie banner does not block keyboard or screen reader access.
- Consent is re-checked correctly on return visits.

## References

- [GDPR: Consent requirements](https://gdpr.eu/gdpr-consent-requirements/)
- [MDN: Cookie API](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [web.dev: Privacy sandbox](https://developer.chrome.com/docs/privacy-sandbox/)
- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
