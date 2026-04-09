# Consent Management

Patterns for storing, reading, applying, and revoking user privacy consent.

## ConsentState type and storage

```ts
// src/lib/consent.ts
export type ConsentPurpose = "analytics" | "marketing" | "personalization";

export type ConsentState = {
  [K in ConsentPurpose]: boolean;
} & {
  version: number;    // increment when the consent form changes
  timestamp: string;  // ISO date of when consent was last given/updated
};

const CONSENT_KEY   = "privacy-consent";
const CONSENT_VERSION = 2; // bump when material changes require re-consent

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    // If the stored version is outdated, treat as no consent
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setConsent(choices: Omit<ConsentState, "version" | "timestamp">): void {
  const state: ConsentState = {
    ...choices,
    version:   CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  applyConsent(state);
}

export function revokeConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
  applyConsent({ analytics: false, marketing: false, personalization: false, version: 0, timestamp: "" });
}

function applyConsent(state: ConsentState): void {
  if (state.analytics)       loadAnalytics();       else unloadAnalytics();
  if (state.marketing)       loadMarketing();       else unloadMarketing();
  if (state.personalization) loadPersonalization(); else unloadPersonalization();
}
```

## Consent banner integration

Show the banner on first visit and when consent version has changed:

```ts
// src/lib/consent-banner.ts
import { getConsent } from "./consent";
import { CONSENT_VERSION } from "./consent";

export function shouldShowConsentBanner(): boolean {
  const consent = getConsent();
  if (!consent) return true;                        // no consent stored
  if (consent.version < CONSENT_VERSION) return true; // outdated version
  return false;
}
```

```tsx
// src/components/ConsentBanner.tsx
import { signal } from "@preact/signals";
import { setConsent, revokeConsent, shouldShowConsentBanner } from "../lib/consent";

const visible = signal(shouldShowConsentBanner());

export function ConsentBanner() {
  if (!visible.value) return null;

  return (
    <aside role="dialog" aria-modal="false" aria-labelledby="consent-title" class="consent-banner">
      <h2 id="consent-title">Your privacy choices</h2>
      <p>
        We use cookies and similar technologies for analytics and marketing.
        Choose your preferences or accept all.{" "}
        <a href="/privacy">Privacy Policy</a>
      </p>

      <div class="consent-banner__actions">
        {/* Reject must be equal in prominence to Accept */}
        <button
          type="button"
          class="btn btn--secondary"
          onClick={() => {
            revokeConsent();
            visible.value = false;
          }}
        >
          Reject all
        </button>

        <button
          type="button"
          class="btn btn--secondary"
          onClick={() => openPreferences()}
        >
          Manage preferences
        </button>

        <button
          type="button"
          class="btn btn--primary"
          onClick={() => {
            setConsent({ analytics: true, marketing: true, personalization: true });
            visible.value = false;
          }}
        >
          Accept all
        </button>
      </div>
    </aside>
  );
}
```

## Preference center

Allow granular control:

```tsx
function ConsentPreferences() {
  const consent = getConsent();
  const analytics       = signal(consent?.analytics ?? false);
  const marketing       = signal(consent?.marketing ?? false);
  const personalization = signal(consent?.personalization ?? false);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      setConsent({
        analytics:       analytics.value,
        marketing:       marketing.value,
        personalization: personalization.value,
      });
    }}>
      <fieldset>
        <legend>Privacy preferences</legend>

        <label class="toggle">
          <input type="checkbox" disabled checked />
          Functional (required — cannot be disabled)
        </label>

        <label class="toggle">
          <input type="checkbox" checked={analytics.value} onChange={(e) => { analytics.value = e.currentTarget.checked; }} />
          Analytics — helps us improve the product
        </label>

        <label class="toggle">
          <input type="checkbox" checked={marketing.value} onChange={(e) => { marketing.value = e.currentTarget.checked; }} />
          Marketing — personalised ads and campaigns
        </label>
      </fieldset>

      <button type="submit" class="btn btn--primary">Save preferences</button>
    </form>
  );
}
```

## Rules

- Re-show the consent banner when `CONSENT_VERSION` increments.
- Functional cookies (session, auth, CSRF) do not require consent — exclude them from the banner.
- Dark patterns prohibited: reject button must be at least as easy to find as accept.
- Do not pre-tick non-essential consent boxes.
- Honor consent choices immediately on the same page without requiring a reload.
