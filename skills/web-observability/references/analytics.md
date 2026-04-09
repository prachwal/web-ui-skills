# Analytics Event Patterns

Patterns for defining, typing, and emitting analytics events safely and consistently.

## Typed event union

Define all events as a discriminated union before implementing any tracking calls:

```ts
// src/lib/analytics.ts

export type AnalyticsEvent =
  | { name: "page_view";       route: string; referrer?: string }
  | { name: "product_viewed";  productId: string; category: string }
  | { name: "add_to_cart";     productId: string; quantity: number; price: number }
  | { name: "checkout_start";  cartValue: number; itemCount: number }
  | { name: "purchase";        orderId: string; revenue: number; currency: string }
  | { name: "search";          query: string; resultCount: number }
  | { name: "error_displayed"; message: string; context: string }
  | { name: "form_submit";     formId: string; success: boolean };

// All event properties are extracted for type safety
type EventName = AnalyticsEvent["name"];
type EventProps<N extends EventName> = Omit<Extract<AnalyticsEvent, { name: N }>, "name">;
```

## track() function with consent check

```ts
// Consent is checked before every event — see web-privacy skill
import { getConsent } from "./consent";

export function track<N extends EventName>(name: N, props: EventProps<N>): void {
  // Skip if no analytics consent
  const consent = getConsent();
  if (!consent?.analytics) return;

  // Skip in local dev unless explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ANALYTICS_DEV) return;

  const event: AnalyticsEvent = { name, ...props } as AnalyticsEvent;

  // Log in development for verification
  if (import.meta.env.DEV) {
    console.debug("[analytics]", event);
    return;
  }

  // Dispatch to your analytics provider
  // Replace with gtag, Plausible, Fathom, Amplitude, etc.
  window.analytics?.track(event.name, pruneUndefined(props));
}

function pruneUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
```

Usage:

```ts
track("add_to_cart", { productId: product.id, quantity: 1, price: product.price });
```

## SPA page view tracking

In single-page applications, re-fire `page_view` on route change:

```ts
// src/lib/router-analytics.ts
import { track } from "./analytics";

let lastRoute: string | null = null;

export function trackPageView() {
  const route = window.location.pathname;
  if (route === lastRoute) return; // prevent double-fire on re-renders
  lastRoute = route;
  track("page_view", {
    route,
    referrer: document.referrer || undefined,
  });
}

// Call at route mount — e.g. in Preact Router's afterChange callback
```

## Privacy constraints on event properties

| Allowed in events | Not allowed in events |
|---|---|
| Product IDs, category slugs | Email addresses |
| Anonymous session IDs | Full names |
| Order IDs (opaque) | IP addresses |
| Aggregate counts | Raw form values |
| Boolean flags (logged in: yes/no) | Passwords, tokens, URLs with PII params |

If a business requirement needs an email in analytics, hash it server-side:

```ts
// On the server, never the client
import { createHash } from "crypto";
const hashedEmail = createHash("sha256").update(email.toLowerCase()).digest("hex");
```

## Event naming conventions

```
{noun}_{verb}          → product_viewed, checkout_started
{noun}_{past_tense}    → form_submitted, payment_failed
screen_{noun}          → screen_home, screen_product_detail (for mobile-style naming)
```

- Use `snake_case` for all event names and properties.
- Keep names stable across releases — events are in production data warehouses.
- Document any name changes with a deprecation notice and a migration date.

## Rules

- Define the full event union before writing any `track()` calls.
- Never include user-identifiable data in event properties unless hashed server-side.
- Fire events at the state change, not on click (clicks can fire without completing the action).
- Instrument the specific transition that proves the business event happened.
- Always check consent before calling `track()`.
