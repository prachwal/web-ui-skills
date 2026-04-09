# Script Loading

Patterns for loading analytics and marketing scripts only after consent is confirmed.

## loadAnalytics / unloadAnalytics

```ts
// src/lib/analytics-loader.ts
let analyticsLoaded = false;
let analyticsScript: HTMLScriptElement | null = null;

export function loadAnalytics(): void {
  // Skip in dev/test environments
  if (import.meta.env.DEV || analyticsLoaded) return;
  analyticsLoaded = true;

  // Example: generic analytics snippet — replace with your provider
  analyticsScript = document.createElement("script");
  analyticsScript.src = "https://cdn.analytics-provider.com/a.min.js";
  analyticsScript.async = true;
  analyticsScript.setAttribute("data-site", import.meta.env.VITE_ANALYTICS_SITE_ID ?? "");
  document.head.appendChild(analyticsScript);
}

export function unloadAnalytics(): void {
  if (!analyticsLoaded) return;
  analyticsLoaded = false;

  // Remove the script tag
  analyticsScript?.remove();
  analyticsScript = null;

  // Disable the provider's tracker if it exposes an API
  window.__analytics?.disable?.();

  // Clear GA-style cookies
  clearGACookies();
}

function clearGACookies(): void {
  const domain = `.${window.location.hostname}`;
  for (const name of ["_ga", "_gid", "_gat", "_ga_XXXXXXXX"]) {
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
  }
}
```

## Page-load initialization

Check consent on every page load and apply immediately:

```ts
// src/main.ts (app entry point)
import { getConsent } from "./lib/consent";
import { loadAnalytics } from "./lib/analytics-loader";
import { ConsentBanner } from "./components/ConsentBanner";

// Apply stored consent before rendering (avoids flash of tracking)
const consent = getConsent();
if (consent?.analytics) {
  loadAnalytics();
}

// Mount app including the consent banner
render(<App />, document.getElementById("app")!);
```

## CSP allowlist for analytics providers

When analytics scripts load dynamically, your Content-Security-Policy header must allow them. In `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' https://cdn.analytics-provider.com;
      connect-src 'self' https://api.analytics-provider.com;
      img-src 'self' data: https://analytics-provider.com;
    """
```

Add each provider's domain explicitly. Do not use `script-src *` or `unsafe-inline` to accommodate analytics scripts.

## Plausible (privacy-by-default example)

Plausible does not use cookies and is GDPR-compliant without consent in most jurisdictions:

```html
<!-- No consent gate needed for Plausible — no personal data collected -->
<script defer data-domain="example.com" src="https://plausible.io/js/script.js"></script>
```

This is the recommended approach for simple analytics: use a privacy-first provider and skip the consent complexity entirely.

## PostHog / Amplitude (full-featured, requires consent)

```ts
// Load only after analytics consent
export function loadPostHog(): void {
  if (analyticsLoaded) return;
  analyticsLoaded = true;

  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host:           "https://app.posthog.com",
      autocapture:        false,   // Opt out of automatic PII capture
      capture_pageview:   false,   // Manually call posthog.capture('$pageview') after consent
      persistence:        "memory", // Do not use cookies until explicit consent
    });
    window.__posthog = posthog;
  });
}

export function unloadPostHog(): void {
  window.__posthog?.opt_out_capturing();
  analyticsLoaded = false;
}
```

## Rules

- Never place analytics `<script>` tags directly in the HTML `<head>` — load them dynamically.
- Remove the script tag AND clear cookies on revoke — removing the script alone does not clear existing cookies.
- Use `import.meta.env.DEV` guard to prevent analytics noise during development.
- Add analytics CSP domains to the CSP header — do not use `script-src *`.
- Consider privacy-first alternatives (Plausible, Fathom) that eliminate the need for consent gates.
