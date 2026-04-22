---
name: vitest-vue-testing
description: Use when writing, fixing, or reviewing tests for Vue 3, TypeScript, Vitest, Vue Test Utils, jsdom, services, state modules, router behavior, snapshots, mocks, or coverage in Vite apps.
---

# Vitest Vue Testing

Use this skill for Vue 3 + Vite projects that test with Vitest and Vue Test Utils.

## Repo Fit

- Follow the repository test policy: cover all `.ts` files with unit tests.
- Test `.vue` files when they contain logic, state, conditional rendering, emitted events, lifecycle behavior, async work, or user interaction.
- For presentational `.vue` files, prefer stable render snapshots or browser visual checks over brittle unit tests.
- Keep tests near the code under test and use the existing `*.test.ts` naming convention.
- Preserve frontend data flow boundaries: `service -> state -> vue`.

## Test Strategy

- Test public behavior, rendered output, emitted events, state transitions, API envelopes, and route resolution.
- Avoid asserting private implementation details such as internal helper names, reactive ref names, class ordering, or exact DOM shape unless the DOM contract is the behavior.
- Prefer focused unit tests for `src/shared`, `src/server`, `src/frontend/services`, and `src/frontend/state`.
- Use component tests for Vue interaction and conditional rendering, not for duplicating service or state unit tests.
- Add regression tests when fixing a bug, especially for API status codes, error codes, env parsing, theme state, and route names.

## Vitest Patterns

- Import test APIs explicitly from `vitest`: `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`.
- Use `npm test -- --run <path>` for a targeted pass and `npm test` for the full suite.
- Use `npm run coverage` when changing shared logic, server handlers, or state factories.
- Use the default `node` environment for pure TypeScript tests.
- Use `jsdom` for Vue components that touch DOM APIs.
- Reset mock state between tests with `vi.restoreAllMocks()` or targeted mock cleanup.
- Treat `vi.mock()` as hoisted; put module mocks before imports that consume the mocked module.
- Prefer `vi.spyOn()` for object methods you can restore cleanly.

## Vue Test Utils Patterns

- Mount SFCs with `mount()` from `@vue/test-utils`.
- Pass data through props and global plugins instead of mutating component internals.
- Await DOM updates after user interaction with `await wrapper.find(...).trigger(...)` and `await nextTick()` when needed.
- For async services, await the promise and then await Vue updates before asserting.
- Assert accessible names and visible text where possible.
- Use stable selectors only when user-facing queries are awkward; prefer existing semantic elements and labels first.
- Stub child components only when the parent contract is what matters.

## Router Tests

- Test route registration with route names and `router.resolve()`.
- For component tests needing routing, create a fresh router with memory history in the test instead of reusing the app singleton when isolation matters.
- Await `router.isReady()` after pushing an initial route.
- Assert navigation outcomes by route name/path and visible page content.

## Mocking Boundaries

- Mock network calls at the service boundary when testing state or components.
- Do not mock shared contracts; those are the behavior being protected.
- For server handler tests, construct realistic request inputs and assert HTTP status, envelope shape, and error codes.
- For date/time dependent tests, use `vi.setSystemTime()` and always restore timers/time after the test.

## Snapshots

- Use snapshots for stable presentational output only.
- Keep snapshots small; large snapshots hide real failures.
- Prefer explicit assertions for logic branches, error states, loading states, and interactive behavior.
- Update snapshots only after inspecting the diff.

## Verification

- Run `npm test` after changing tests or tested behavior.
- Run `npm run build` when changes affect types, Vue templates, Vite config, router imports, or public contracts.
- If a UI change is visual or theme-related, use browser verification after unit tests.
