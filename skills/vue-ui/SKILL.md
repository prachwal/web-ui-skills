---
name: vue-ui
description: Use when designing, refactoring, or reviewing Vue 3 applications and components, including Composition API, SFC structure, Pinia state, Vue Router, Vue I18n, Vite, Vitest, Vue Test Utils, accessibility, and production app architecture.
---

# Vue UI Skill

Use this skill when building Vue 3 applications, Vue Single-File Components, feature modules, routing, state, i18n, or tests.
Prefer Vue 3, TypeScript, `<script setup>`, Vite, and Composition API for new application work.

## Architecture

Organize large apps by feature ownership and keep framework glue thin:

```text
src/
  app/             # app bootstrap, providers, router, i18n, global shell
  components/      # shared presentational components
  composables/     # reusable Composition API logic
  features/        # feature-owned views, stores, services, components
  layouts/         # route shells and page layout components
  router/          # route records, guards, lazy route imports
  services/        # API clients, storage, browser integrations
  stores/          # cross-feature Pinia stores
  styles/          # global styles, tokens, themes
  test/            # test setup, factories, mocks
```

Keep domain rules in plain TypeScript modules, shared behavior in composables, and rendering in Vue components.

## Core Defaults

- Use Single-File Components for component UI and colocated component styles.
- Use `<script setup lang="ts">` unless Options API compatibility is required.
- Prefer `ref`, `computed`, and composables for local component logic.
- Use `reactive` for cohesive object state, not for arbitrary bags of unrelated values.
- Use Pinia for app-level or cross-route state.
- Use Vue Router for route ownership, URL state, guards, and lazy route code splitting.
- Use Vue I18n in Composition API mode for translations, plurals, numbers, dates, and locale switching.
- Use Vite with `@vitejs/plugin-vue`; use Vue CLI only for legacy maintenance.
- Use Vitest plus Vue Test Utils for unit and component tests.

## Component Rules

- Keep templates readable: move complex expressions into named `computed` values or methods.
- Treat props as immutable inputs; emit events or call commands to request changes.
- Define props and emits with TypeScript macros: `defineProps`, `withDefaults`, and `defineEmits`.
- Keep business rules out of templates and route views.
- Use slots for visual extension points, not for passing hidden control flow.
- Prefer semantic HTML before ARIA.
- Use scoped styles for component-local rules and global tokens for theme decisions.

## State

- Start with local `ref` or `computed` state.
- Extract reusable logic to composables when multiple components need the same behavior.
- Use Pinia setup stores for cross-route state, auth/session state, user preferences, cached entities, and shared commands.
- Keep server cache concerns in a data-fetching layer; do not turn Pinia into a stale backend mirror by default.
- Persist only explicit, low-risk state and version persisted schemas.

## Routing

- Define route records in one router module and lazy-load route views.
- Use `createWebHistory()` for production SPAs and configure server fallback to `index.html`.
- Add an app-level not-found route for unmatched paths.
- Keep route components thin: layout, metadata, data owner, and feature entry point.
- Store shareable UI state in query params when users expect deep links.
- Use guards for authorization and navigation policy, not for general component setup.

## I18n

- Use `createI18n({ legacy: false })` and `useI18n()` for Vue 3 Composition API apps.
- Keep translation keys stable and domain-oriented.
- Use plural, datetime, and number formatting APIs instead of manual string assembly.
- Avoid hardcoded visible text in reusable components.
- Keep locale loading and fallback behavior explicit.
- Coordinate `lang`, `dir`, route metadata, and document title with `web-i18n` and `web-seo-metadata`.

## Tooling

- Scaffold new apps with `npm create vue@latest` or the package manager equivalent.
- Configure Vue SFC support with `@vitejs/plugin-vue`.
- Use `vue-tsc` for type-checking templates and SFC props from CI.
- Keep Vitest config close to Vite config unless the repository already separates it.
- Add `@vue/test-utils` for mounted component tests.
- Prefer official Vue tooling and ecosystem libraries before custom framework glue.

## Popular Libraries

- `pinia` for state management.
- `vue-router` for routing.
- `vue-i18n` for internationalization.
- `@vueuse/core` for reusable browser and reactivity composables.
- `@vue/test-utils` for Vue component tests.
- `vitest` for Vite-native unit and component testing.
- `eslint-plugin-vue` plus TypeScript ESLint for linting SFCs.
- `vee-validate` or `vuelidate` for complex forms when native validation and local rules are not enough.
- `unplugin-vue-router` for typed route generation when route count or route params justify it.

## References

- [references/app-architecture.md](references/app-architecture.md): app structure, components, composables, and feature boundaries
- [references/state-pinia.md](references/state-pinia.md): local state, composables, Pinia stores, persistence, and testing
- [references/routing.md](references/routing.md): Vue Router, lazy routes, guards, URL state, and SPA fallback
- [references/i18n.md](references/i18n.md): Vue I18n Composition API patterns and locale behavior
- [references/vite-vitest.md](references/vite-vitest.md): Vite, Vitest, Vue Test Utils, `vue-tsc`, and CI checks
