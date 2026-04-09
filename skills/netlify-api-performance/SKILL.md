---
name: netlify-api-performance
description: Use when optimizing Netlify backend APIs for speed, cost, cold starts, database efficiency, caching, regional behavior, and reliable production observability.
---

# Netlify API Performance Skill

Use this skill when a TypeScript API on Netlify needs to be faster, cheaper, or more reliable under load.

## Performance goals

- Reduce cold-start overhead.
- Minimize database round trips.
- Keep responses small and cacheable where possible.
- Avoid unnecessary work inside the function runtime.

## Scope

- Assume the execution primitive has already been chosen.
- Keep this skill focused on latency, throughput, cache behavior, and production measurements.
- Use `netlify-serverless` for platform limits and routing primitives.

## Rules

- Load heavy modules lazily when practical.
- Keep shared initialization minimal.
- Move expensive computation out of the request path.
- Prefer one query that returns the needed shape over multiple sequential queries.
- Paginate large collections by default.
- Cache static or slow-changing results explicitly, but pick the right cache primitive for the consistency you need.
- Use `context.waitUntil()` for telemetry or trailing work that should not block the response.

## Database efficiency

- Index columns used in filters, joins, and ordering.
- Limit returned columns to the data actually used.
- Avoid unbounded scans and unbounded joins.
- Measure query latency and fix the slowest paths first.
- Use explain plans before guessing at optimizations.
- Align function region and database region whenever possible.

## API efficiency

- Use concise response schemas.
- Stream only when it materially improves UX and the response can complete within Netlify's streaming limits.
- Return early for invalid requests.
- Use idempotent writes where retries are possible.
- Add project-level rate limits or request shaping for expensive endpoints.

## Caching strategy

- Use HTTP cache headers for CDN-friendly GET responses first.
- Use Netlify Cache API when you need programmatic caching inside Functions or Edge Functions.
- Do not assume Cache API entries are global. Netlify documents that Cache API data is shared within a region, not replicated across regions, and invalidated on redeploy.
- Use Netlify Blobs for simple read-heavy persistence, not as a substitute for a strongly consistent relational cache or queue.

## Observability checklist

- Log request IDs, route names, and latency.
- Track error rates separately from latency.
- Capture slow queries and timeout counts.
- Test the function with realistic payload sizes.
- Recheck performance after schema or dependency changes.
- Separate cold-start regressions from database regressions in measurements.

## Reference files

### [`references/caching-strategy.md`](references/caching-strategy.md)
**Caching primitive selection and code** — Comparison table of HTTP headers vs. Cache API vs. Netlify Blobs vs. in-module variables (scope, consistency, use case), HTTP `Cache-Control` + `CDN-Cache-Control` examples, Netlify Cache API programmatic pattern with TTL and invalidation, Blobs-based rendered-output cache, consistency caveats, and rules.

### [`references/db-efficiency.md`](references/db-efficiency.md)
**Query optimization and N+1 prevention** — Column projection with `SELECT` field list, bounded pagination with allowlisted sort/order, N+1 example → JOIN fix → bulk-fetch-and-join alternative, `EXPLAIN ANALYZE BUFFERS` usage guide, index patterns (single, compound, partial), and rules including atomic operations.

### [`references/observability.md`](references/observability.md)
**Structured logging, latency tracking, cold-start detection** — `RequestLog` type with cold-start flag, `withLatency()` wrapper for any async operation, error emission with route + stack context, `/api/metrics` ingestion endpoint using `context.waitUntil()`, cold-start vs. query regression separation table, rules for `requestId` and telemetry safety.

## External references

- Pair with [../netlify-serverless/SKILL.md](../netlify-serverless/SKILL.md) for execution-model limits and constraints.
- [Get started with functions](https://docs.netlify.com/functions/get-started/)
- [Background Functions overview](https://docs.netlify.com/functions/background-functions/)
- [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)
- [Edge Functions limits](https://docs.netlify.com/edge-functions/limits/)
- [Cache API](https://docs.netlify.com/platform/cache-api/)
- [Netlify Blobs overview](https://docs.netlify.com/storage/blobs/overview/)
