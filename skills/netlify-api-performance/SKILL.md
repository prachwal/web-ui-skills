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

## Platform limits that matter

- Synchronous Functions can stream responses, but Netlify documents a 10 second execution limit for streaming and a 20 MB streamed response size limit.
- Background Functions can run for up to 15 minutes and are a better fit for slow workflows than synchronous request handlers.
- Scheduled Functions have a 30 second execution limit and only run on published deploys.
- Edge Functions have a documented 20 MB compressed code size limit, 512 MB memory limit, and 50 ms CPU limit.

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

## References

- [Get started with functions](https://docs.netlify.com/functions/get-started/)
- [Background Functions overview](https://docs.netlify.com/functions/background-functions/)
- [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)
- [Edge Functions limits](https://docs.netlify.com/edge-functions/limits/)
- [Cache API](https://docs.netlify.com/platform/cache-api/)
- [Netlify Blobs overview](https://docs.netlify.com/storage/blobs/overview/)
