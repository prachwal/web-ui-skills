---
name: vue-router
description: Use when adding, changing, testing, or reviewing Vue Router routes, route names, navigation, guards, lazy-loaded pages, scroll behavior, route-level accessibility, or page composition in Vue 3 apps.
---

# Vue Router

Use this skill for Vue Router work in Vue 3 applications.

## Repo Fit

- Keep route-level UI in `src/frontend/pages/`.
- Import pages through the page barrel where that is the established surface.
- Keep route names stable; tests and navigation should resolve by name where possible.
- Use `RouterLink` for internal navigation instead of plain anchors.
- Keep one `RouterView` in the app shell unless a layout change requires nested route views.
- Preserve `scrollBehavior()` returning top-of-page navigation unless product behavior changes.

## Route Design

- Add routes in `src/frontend/router/index.ts`.
- Give every user-facing route a stable `name`.
- Keep paths short, readable, lowercase, and URL-safe.
- Use route meta for cross-cutting facts such as title, auth requirements, layout, or feature flags.
- Keep redirects explicit and covered by tests.
- Add a catch-all route only when there is an actual not-found page.

## Lazy Loading

- Use dynamic imports for heavier or less frequently visited pages:

```ts
const ExperiencePage = () => import('@/pages/ExperiencePage.vue')
```

- Keep above-the-fold critical pages eager if the current UX benefits from immediate first load.
- Group chunks only when there is a measured or obvious navigation benefit.
- Do not lazy-load tiny pages just for ceremony.

## Guards

- Use global guards for app-wide policy only.
- Use per-route guards or meta-driven checks for route-specific policy.
- Return values from guards: `false` cancels, a route location redirects, and no return allows navigation.
- Keep async guards small; long data loading belongs in state/services or route-aware loaders, not in a sprawling guard.
- Avoid guard loops by checking the target route before redirecting.

## Component And Composition API

- Use `useRoute()` for current route data and `useRouter()` for imperative navigation.
- Prefer route params/query as input, then pass normalized values to state or services.
- Watch only the specific route fields needed, such as `route.params.id`, not the whole route object.
- Keep page components responsible for page semantics and orchestration; keep reusable UI in components.

## Accessibility

- Navigation links need clear accessible names and visible focus states.
- Mark current navigation with router-aware active states or `aria-current="page"` where appropriate.
- After route changes, ensure the new page has a meaningful top-level heading.
- Preserve keyboard order through header navigation, main content, and footer.

## Tests

- Assert route registration with `router.hasRoute(name)`.
- Assert path resolution with `router.resolve({ name }).path`.
- For guards, test allow, cancel, and redirect cases.
- For component tests, use a fresh router instance with memory history when isolation matters.
- Run `npm test -- --run src/frontend/router` after router changes.
