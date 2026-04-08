---
name: web-testing
description: Use when designing or refactoring web UI test strategy, including Playwright-based end-to-end tests, regression coverage, stable locators, visual comparisons, and CI reporting.
---

# Web Testing Skill

Use this skill when you need a practical test strategy for a web app, especially for user-visible flows and regression coverage.

## Core principles

1. Test user behavior, not implementation details.
2. Put the right assertion at the right layer: unit, component, E2E, or visual regression.
3. Prefer stable locators based on role, label, text, or test ids only when needed.
4. Keep tests deterministic and isolate external dependencies.
5. Cover the critical paths first, then expand to edge cases.
6. Treat flaky tests as defects in the test design.

## Workflow

1. Identify the critical flows: sign-in, sign-up, checkout, edit/save, search, navigation, error handling.
2. Choose the minimum test layer that proves the behavior.
3. Use browser automation for end-to-end journeys and realistic rendering.
4. Add visual comparisons only for stable UI surfaces with controlled baselines.
5. Collect artifacts and reports so failures are easy to triage.
6. Run the suite in CI across the browsers the app supports.

## Practical rules

- Prefer `getByRole`, `getByLabelText`, and similar user-facing queries.
- Keep assertions tied to visible outcomes.
- Use screenshots only when visual stability matters and the baseline is under control.
- Keep accessibility smoke checks in the E2E layer.
- Mock the network only when the real dependency makes the test too slow or unstable.
- Avoid brittle timing assumptions.

## References

- [references/playwright-basics.md](references/playwright-basics.md)
- [references/visual-regression.md](references/visual-regression.md)
- [references/ci-reporting.md](references/ci-reporting.md)
