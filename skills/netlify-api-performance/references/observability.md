# API Observability

Structured logging, latency tracking, cold-start detection, and production measurement patterns.

## Structured request log

```ts
// netlify/functions/_lib/logger.ts
export type RequestLog = {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  coldStart: boolean;
  error?: string;
};

let isFirstInvocation = true;

export function logRequest(log: RequestLog) {
  const isCold = isFirstInvocation;
  isFirstInvocation = false;

  console.log(
    JSON.stringify({
      level: log.error ? "error" : "info",
      ...log,
      coldStart: isCold,
      ts: new Date().toISOString(),
    }),
  );
}
```

## Latency tracking wrapper

```ts
// netlify/functions/_lib/measure.ts
export async function withLatency<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  try {
    const result = await fn();
    return { result, durationMs: Math.round(performance.now() - start) };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    console.error(JSON.stringify({ label, durationMs, error: String(err) }));
    throw err;
  }
}

// Usage in a handler
export default async (req: Request) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const { result: products, durationMs } = await withLatency("db.getProducts", getProducts);

  logRequest({ requestId, method: req.method, path: "/api/products",
                status: 200, durationMs, coldStart: false });

  return Response.json({ data: products });
};
```

## Error rate tracking

```ts
// Emit errors with enough context to slice by route and type
function emitError(req: Request, err: unknown, requestId: string) {
  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      path: new URL(req.url).pathname,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined,
      ts: new Date().toISOString(),
    }),
  );
}
```

## Netlify Function ingestion endpoint for metrics

```ts
// netlify/functions/metrics.ts — collect vitals or API metrics via sendBeacon
import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return new Response(null, { status: 400 });

  // Forward to your observability sink (Datadog, Axiom, custom)
  context.waitUntil(forward(body, context.requestId));

  return new Response(null, { status: 204 });
};

export const config: Config = { path: "/api/metrics" };
```

## Cold-start vs. query regression — separation guide

| Metric pattern | Likely cause |
|---|---|
| First invocation always slow, subsequent fast | Cold start (module init, connection setup) |
| All invocations consistently slow | Query latency or heavy DB round trip |
| Latency spikes under concurrent load | Connection pool exhaustion |
| Latency increases after deploy | Dependency change, heavier module init |
| Latency increases without deploy | Database growth, missing index |

## Rules

- Include `requestId` in every log line — use `context.requestId` or generate via `crypto.randomUUID()`.
- Log cold starts separately so infra can distinguish them from genuine regressions.
- Use `context.waitUntil()` for telemetry emission so it does not add to the response latency.
- Track slow queries (> 100ms) explicitly so regressions surface before users report them.
- Never log credentials, raw query parameters containing PII, or full request bodies.
