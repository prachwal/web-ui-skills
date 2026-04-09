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

## Consent architecture

```ts
// src/lib/consent.ts
export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_KEY = "privacy-consent";

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

export function setConsent(state: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  applyConsent(state);
}

export function revokeConsent() {
  localStorage.removeItem(CONSENT_KEY);
  applyConsent({ analytics: false, marketing: false });
}

function applyConsent(state: ConsentState) {
  if (state.analytics) {
    loadAnalytics();
  } else {
    unloadAnalytics();
  }
}
```

## Conditional script loading

Do not place tracking scripts in `<head>` unconditionally. Load only after consent:

```ts
// src/lib/analytics.ts
let loaded = false;

export function loadAnalytics() {
  if (loaded || import.meta.env.DEV) return;
  loaded = true;

  const script = document.createElement("script");
  script.src = "https://analytics.example.com/a.js";
  script.async = true;
  document.head.appendChild(script);
}

export function unloadAnalytics() {
  // Remove cookies and disable tracking
  // Exact API depends on your analytics provider
  window.__analytics?.disable?.();
  document.cookie = "_ga=; Max-Age=0; path=/; domain=.example.com";
  document.cookie = "_gid=; Max-Age=0; path=/; domain=.example.com";
  loaded = false;
}
```

## Strip PII from URLs

Remove sensitive query params after use (e.g. magic link tokens, pre-filled emails):

```ts
function stripParamsFromUrl(params: string[]) {
  const url = new URL(window.location.href);
  let changed = false;
  for (const param of params) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }
  if (changed) {
    history.replaceState(null, "", url.toString());
  }
}

// After consuming a magic link token:
stripParamsFromUrl(["token", "email", "invite"]);
```

## Cookie consent banner rules

- Do not pre-tick non-essential consent boxes.
- Make "Reject all" or "Decline" as prominent as "Accept all" — equal size, same position.
- Allow managing granular preferences (analytics vs. marketing vs. functional).
- Show the banner again if consent is older than the configured expiry or the policy changes.
- Functional cookies needed for authentication do not require consent.

## Sensitive data in storage

```ts
// Never store tokens in localStorage — use HttpOnly cookies on the server
// Never store sensitive user data in sessionStorage when it can be avoided
// Acceptable in sessionStorage: transient UI state (current step, draft form)
// Not acceptable: auth tokens, passwords, PII beyond display name

// Redact sensitive fields before logging
function redactForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const REDACTED = "[redacted]";
  const SENSITIVE = new Set(["password", "token", "secret", "authorization", "email", "ssn"]);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, SENSITIVE.has(k.toLowerCase()) ? REDACTED : v]),
  );
}
```

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
