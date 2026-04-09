# Core Web Vitals

Patterns for collecting and reporting real-user Core Web Vitals using the `web-vitals` library.

## Install

```bash
npm install web-vitals
```

## Collect all vitals and report via sendBeacon

```ts
// src/lib/vitals.ts
import type { Metric } from "web-vitals";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

export interface VitalReport {
  name:      string;
  value:     number;
  rating:    "good" | "needs-improvement" | "poor";
  id:        string;
  navigationType: string;
  route:     string;
  delta:     number;
}

function sendVital(metric: Metric): void {
  // Skip in dev/test environments
  if (import.meta.env.DEV) {
    console.debug("[vitals]", metric.name, metric.value, metric.rating);
    return;
  }

  const report: VitalReport = {
    name:           metric.name,
    value:          Math.round(metric.value), // ms values only need integers
    rating:         metric.rating,
    id:             metric.id,
    navigationType: metric.navigationType,
    route:          window.location.pathname,
    delta:          metric.delta,
  };

  // sendBeacon does not block page unload — preferred for send-on-unload patterns
  const success = navigator.sendBeacon(
    "/api/vitals",
    JSON.stringify(report),
  );

  if (!success) {
    // Fallback: fetch with keepalive
    void fetch("/api/vitals", {
      method: "POST",
      body: JSON.stringify(report),
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function initVitals() {
  onCLS(sendVital);
  onFCP(sendVital);
  onINP(sendVital);
  onLCP(sendVital);
  onTTFB(sendVital);
}
```

Call once at app startup, after consent is confirmed:

```ts
import { initVitals } from "./lib/vitals";
import { getConsent } from "./lib/consent";

if (getConsent()?.analytics) {
  initVitals();
}
```

## SPA route transition handling

LCP and CLS reporting resets automatically per navigation with `web-vitals` v3+. For explicit SPA transitions, call `onLCP` again on route change:

```ts
import { onLCP } from "web-vitals";

// In router's afterChange hook:
export function trackRouteVitals() {
  // web-vitals v3+ emits per-navigation metrics automatically.
  // Only explicitly re-subscribe if your framework needs it.
  onLCP(sendVital, { reportAllChanges: false });
}
```

## Thresholds reference

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2500ms | ≤ 4000ms | > 4000ms |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP (First Contentful Paint) | ≤ 1800ms | ≤ 3000ms | > 3000ms |
| TTFB (Time to First Byte) | ≤ 800ms | ≤ 1800ms | > 1800ms |

## Server-side aggregation endpoint (Netlify Functions)

```ts
// netlify/functions/vitals.ts
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });

  const report = await req.json();

  // Forward to your observability backend (Datadog, BigQuery, etc.)
  // Keep this lightweight — it is called for every page visit
  await forwardToMetricsStore(report);

  return new Response(null, { status: 204 });
};

export const config: Config = { path: "/api/vitals" };
```

## Rules

- Collect vitals only after analytics consent is confirmed.
- Use `sendBeacon` so the report does not block page unload.
- Keep the vitals endpoint lightweight — it receives one request per metric per page visit.
- Separate vitals from error reports — different retention, different alerting.
- Monitor CLS after layout or font changes; monitor LCP after adding large images or hero sections.
- Alert on p75 or p95 thresholds, not averages — outliers matter for user experience.
