# Vue Router

## Route Setup

Use Vue Router for SPA route ownership:

```ts
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/features/home/HomeView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/features/not-found/NotFoundView.vue'),
    },
  ],
})
```

## Route Rules

- Lazy-load route views by default.
- Keep route records close to router setup or feature route modules.
- Use route `meta` for auth policy, title keys, layout choice, and analytics labels.
- Keep route views thin: they compose layout, data owner, and feature entry point.
- Put filters, search, pagination, and selected tabs in query params when users need shareable URLs.

## Guards

- Use global guards for auth and app-wide navigation policy.
- Use per-route guards for feature-specific permission checks.
- Avoid fetching all page data in guards unless the UX requires blocking navigation.
- Show global pending feedback when navigation waits for async work.

## Data Fetching

Choose route data timing by UX:

- Fetch after navigation when the new view can render a loading state.
- Fetch before navigation when users should stay on the previous view until the next view is ready.

Always handle loading, error, empty, and cancellation or stale-result behavior.

## Deployment

Use `createWebHistory()` for clean URLs, then configure the host to serve `index.html` for unmatched static paths. Keep an in-app catch-all route so unknown URLs render a real not-found view.

Coordinate production fallback with `web-deployment`, `vercel-deploy`, or Netlify skills depending on host.
