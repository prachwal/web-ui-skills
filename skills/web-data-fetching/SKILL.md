---
name: web-data-fetching
description: Use when implementing or reviewing frontend data fetching, including loading, error, empty, retry, cancellation, cache invalidation, optimistic updates, and typed API boundaries.
---

# Web Data Fetching Skill

Use this skill when UI state depends on API calls, server data, local cache, or mutations.

## Core goals

- Make loading, empty, error, and success states explicit.
- Avoid stale data, race conditions, and duplicate request storms.
- Keep API contracts typed and validated at boundaries.
- Align cache behavior with product correctness needs.

## Checklist

- [ ] Each request has a defined owner: route, component, view model, or data layer.
- [ ] Loading, error, empty, and success states are represented in UI.
- [ ] Fetches are cancellable or guarded against stale responses when inputs change.
- [ ] Retry behavior is intentional and bounded.
- [ ] Mutations define cache invalidation or optimistic update behavior.
- [ ] User-specific data is not cached in shared browser or CDN caches.
- [ ] API response shapes are typed and validated before use in UI.
- [ ] Pagination, filtering, and sorting are bounded.
- [ ] Network errors and server errors produce actionable messages.
- [ ] Tests cover slow responses, errors, empty states, and rapid input changes.

## Implementation rules

- Prefer one data-loading pattern per app or feature area.
- Keep fetch logic out of presentational components.
- Use `AbortController` or request versioning for input-driven fetches.
- Debounce user-driven search where it reduces unnecessary load.
- Do not retry non-idempotent mutations unless the API supports idempotency.
- Separate transport errors from domain errors in UI state.
- Keep cache keys stable and include all query inputs that affect results.

## Testing focus

- Race conditions when route params or filters change quickly.
- Retry and backoff behavior.
- Stale cache after create, update, or delete.
- Auth expiration and forbidden responses.
- Offline or flaky network behavior where relevant.

## References

- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [TanStack Query docs](https://tanstack.com/query/latest)
- [web.dev: Network reliability](https://web.dev/learn/pwa/network)
