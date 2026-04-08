---
name: preact-ui
description: Use when designing, refactoring, or reviewing Preact pages and components, including component structure, MVVM architecture, signals, hooks, forms, routing, data fetching, accessibility, SCSS integration, and tests.
---

# Preact UI Skill

Use this skill when building Preact pages, component systems, or full applications.
Prefer the **MVVM (Model–View–ViewModel)** pattern to cleanly separate business logic from rendering.

## Architecture: MVVM in Preact

Organize code into three layers:

- **Model** — pure TypeScript modules for domain data, validation rules, and API contracts. No Preact imports.
- **ViewModel** — custom hooks (`useXxxViewModel`) or module-level signals that hold state, computed values, and commands. Bridges Models to Views.
- **View** — functional components that only render and call ViewModel hooks. No business logic inside.

Directory layout:

```
src/
  models/          # domain types, validation, factories
  viewmodels/      # useXxxViewModel hooks, signal stores
  components/      # shared presentational UI atoms/molecules
  features/        # feature slices (view + viewmodel colocated)
  routes/          # route-level page components
  services/        # API clients, storage adapters
  hooks/           # generic reusable hooks
  styles/          # global SCSS, tokens, mixins
```

## Core approach

1. Define the Model first — data shape, validation, and invariants.
2. Build the ViewModel — expose signals, computed values, and actions.
3. Build the View last — render only, bind to the ViewModel.
4. Keep components small and composable.
5. Treat accessibility and responsiveness as design constraints, not afterthoughts.

## Preact fundamentals

- Import from `preact` and `preact/hooks`, not React.
- Use `@preact/signals` for reactive state — prefer over `useState` for shared or performance-sensitive state.
- Use `preact/compat` only when consuming React-targeting third-party libraries.
- Use `preact-iso` (the official meta-framework router) or `preact-router` for client-side routing.
- Scaffold new projects with `npm create preact@latest` — it sets up Vite, TypeScript, and preact-iso.

## Signals (preferred state primitive)

- `signal(value)` — reactive value; read `.value`, write `.value =`.
- `computed(() => expr)` — derived signal; recalculates only when dependencies change.
- `effect(() => sideEffect)` — runs when dependencies change; call the returned cleanup to dispose.
- `useSignal(value)` — component-scoped signal; behaves like `useState` but with signal semantics.
- `useComputed(() => expr)` — component-scoped computed signal.
- Pass signals directly into JSX: `<span>{count}</span>` updates the DOM node without re-rendering the component.
- Define shared signals in a ViewModel module; import them in View components.
- Use `batch(() => { ... })` to group multiple signal updates into a single render.

## Hooks and state

- Use `useState` / `useSignal` for purely local UI state (toggle, hover, open).
- Use `useEffect` for external subscriptions, timers, and DOM side-effects; always return cleanup.
- Use `useRef` for DOM references and mutable values that should not trigger re-renders.
- Use `useMemo` / `useComputed` for expensive derived computations.
- Use `useCallback` only when passing stable references to memoized children.
- Avoid `useEffect` for data that can be modelled as derived/computed state.

## Workflow

1. Identify the page role:
   - marketing / landing page
   - dashboard with live data
   - form flow (wizard, multi-step)
   - content / article page
   - interactive tool or widget
2. Define the layout hierarchy before writing any component code.
3. Separate presentational and data-fetching concerns.
4. Model state intentionally:
   - local signal/state for local UI
   - module-level signals for cross-component shared state
   - `computed` for derived values — never duplicate state
5. Wire routing at the route layer; keep route components thin.
6. Integrate SCSS through predictable class names and component-scoped partials.
7. Add accessibility checks for keyboard, labels, focus order, and semantics.
8. Write tests for user-visible behavior, not implementation details.

## Component rules

- One main concern per component.
- Props describe intent, not DOM mechanics.
- Use semantic HTML first; add ARIA only when semantics are insufficient.
- Avoid overusing Context when signals or props are simpler.
- Never put business logic inside a View component — move it to the ViewModel.
- Memoize with `memo()` only when profiling identifies a bottleneck.

## Forms

- Use controlled inputs when validation or live feedback is needed; use signals for field values.
- Use uncontrolled inputs (`useRef`) for simple cases without validation.
- Expose clear inline validation messages tied to each field.
- Keep submit, pending, and error states visible and distinct.
- Preserve keyboard focus after submit or error.
- Centralize form validation rules in the Model layer.

## Data fetching

- Define API calls in `src/services/` — return typed results, never raw `fetch` in components.
- Expose loading, data, and error signals from the ViewModel.
- Handle retry and cancellation in the service layer (use `AbortController`).
- Keep transport details (headers, base URL, serialization) out of components.
- Use `useEffect` with cleanup for subscriptions; prefer signal-driven fetch triggers.

## Routing (preact-iso)

- Use `<Router>` and `<Route path="...">` from `preact-iso` for declarative routing.
- Use lazy loading (`lazy()` + `Suspense`) for route-level code splitting.
- Keep route components thin — they delegate to feature-level Views.
- Read route params via the `useRoute()` hook; never parse `window.location` manually.
- Handle 404 with a catch-all `<Route default>` component.

## SCSS integration

- Use a stable BEM-like class naming scheme aligned with the component name.
- Pair each component with a focused `_component.scss` partial.
- Reuse design tokens, mixins, and spacing scales from the global SCSS system.
- Define responsive breakpoints and theme variants at the token level, not inline.
- Keep dark/light theme support via CSS custom properties toggled at the root.

## Accessibility

- Use semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`).
- Use real `<button>` and `<a>` elements — never `<div onClick>`.
- Every interactive element must have a visible focus indicator.
- Support full keyboard navigation: Tab, Enter, Space, Escape, Arrow keys where appropriate.
- Label every form field with `<label>` or `aria-label`.
- Expose error messages via `aria-describedby` or `role="alert"`.
- Meet WCAG AA contrast ratios in all themes.

## Testing

- Use `@testing-library/preact` for component tests.
- Test user-visible behavior: rendering, interactions, state changes, async flows.
- Cover loading, error, empty, and success states for async components.
- Test forms end-to-end: fill, validate, submit, success, and server error paths.
- Prefer realistic queries (`getByRole`, `getByLabelText`) over brittle `getByTestId`.
- Mock only the service layer — let ViewModels and Views run real logic in tests.

## Performance tips

- Prefer signals for high-frequency UI state to avoid full component re-renders.
- Lazy-load routes and heavy components with `lazy()` + `Suspense`.
- Keep the bundle small: Preact is ~3 kB — avoid importing heavy React-ecosystem packages.
- Use `memo()` around expensive list items or stable sub-trees identified by profiling.
- Avoid anonymous arrow functions in JSX props on hot render paths.

## References

- [references/mvvm.md](references/mvvm.md): MVVM architecture patterns
- [references/signals.md](references/signals.md): signals, computed, and effects
- [references/layout.md](references/layout.md): page structure and composition
- [references/state.md](references/state.md): state, hooks, and data flow
- [references/forms.md](references/forms.md): form patterns and validation
- [references/routing.md](references/routing.md): routing with preact-iso
- [references/accessibility.md](references/accessibility.md): accessible UI rules
- [references/testing.md](references/testing.md): testing patterns
