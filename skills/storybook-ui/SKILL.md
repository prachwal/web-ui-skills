---
name: storybook-ui
description: Use when building, documenting, and testing UI components with Storybook. Covers setup, CSF stories, interaction tests, Vitest addon, accessibility, visual testing, and component documentation workflows.
---

# Storybook UI Skill

Use this skill when a frontend project needs a component workshop, UI documentation, isolated state development, or story-driven testing.

## Core goals

- Build components and pages in isolation.
- Turn stories into durable documentation and executable tests.
- Cover visual states, interactions, and accessibility from one workflow.
- Keep stories close to real usage, not artificial demos.

## Recommended workflow

1. Install Storybook with `npm create storybook@latest`.
2. Use the framework-specific Vite integration when available.
3. Write stories in CSF and model realistic states and edge cases.
4. Add interaction tests through `play` functions where user behavior matters.
5. Add the Vitest addon for component tests in the Storybook UI and CI.
6. Add the a11y addon and fail stories intentionally where accessibility matters.
7. Add Chromatic visual tests if the team wants hosted visual regression coverage.
8. Before closing the task, run the Storybook Docs DoD self-audit (`Requirement | Done | Where`) from `references/setup.md`.

## Story rules

- Keep one story per meaningful UI state.
- Include loading, error, empty, success, disabled, and long-content states.
- Prefer realistic props and mock data.
- Do not hide product constraints behind story-only hacks.
- Keep stories deterministic and free from flaky timers or network dependencies.

## Testing guidance

- Use `npx storybook add @storybook/addon-vitest` for component tests.
- Use browser-mode testing rather than JSDom-only assumptions when the framework supports it.
- Use `play` functions for user interactions and assertions.
- Use `parameters.a11y.test = "error"` for stories that should fail CI on accessibility violations.
- Tag unstable or experimental stories explicitly instead of letting them fail the whole suite accidentally.

## Accessibility and visual testing

- Add `@storybook/addon-a11y` for built-in accessibility checks.
- Use the visual testing addon when visual regressions are expensive or frequent.
- Treat Storybook as a review surface for responsive behavior, keyboard flow, and focus states, not only snapshots.

## Preact guidance

- If the repo uses Preact, prefer the Preact Vite Storybook framework.
- Keep stories presentational and push domain logic into view models or hooks.
- Mock service layers instead of doing real network calls inside stories.

## Documentation guidance

- Use Storybook docs to show component intent, props, usage patterns, and anti-patterns.
- Keep design-system primitives and product components documented separately when the repo has both.
- Use stories as the canonical examples referenced in PRs and design reviews.

## CI guidance

- Build Storybook in CI for publishable docs.
- Run component and accessibility tests on pull requests.
- Run visual tests on pull requests when the team uses Chromatic or an equivalent baseline workflow.
- Treat failing stories as product regressions unless the story is explicitly experimental.

## Reference files

### [`references/setup.md`](references/setup.md)
**Installation and configuration** — `npm create storybook@latest` command, typed `main.ts` with Vite framework, addon list (essentials, a11y, vitest), `preview.ts` with global styles import and `a11y.test: "error"`, npm scripts, file layout convention (stories next to components), rules for framework selection and CSS setup, plus the mandatory Storybook Docs Definition of Done checklist (Autodocs + MDX).

### [`references/story-patterns.md`](references/story-patterns.md)
**CSF stories and interaction tests** — Typed `Meta` + `StoryObj` pattern with `argTypes`, full state coverage (default/loading/disabled/error/empty/long-label), `play` function examples for form validation and submit state, MSW handler mock pattern for loading/empty/error network states, rules for realistic deterministic stories.

### [`references/ci-testing.md`](references/ci-testing.md)
**CI workflow and visual regression** — `@storybook/addon-vitest` setup with `vitest.config.ts` browser-mode config, full GitHub Actions workflow (checkout → Playwright → vitest → build-storybook → Chromatic), per-story `a11y` test override and disable patterns, Chromatic baseline workflow, experimental story tagging with exclusion, rules for CI failures.

## External references

- [Get started with Storybook](https://storybook.js.org/docs)
- [Install Storybook](https://storybook.js.org/docs/get-started/install)
- [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index)
- [Accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Visual tests](https://storybook.js.org/docs/writing-tests/visual-testing)
