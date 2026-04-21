---
description: Vitest and Testing Library rules for co-located tests.
applyTo: "src/**/*.test.{ts,tsx}, src/**/*.spec.{ts,tsx}, src/config/setupTests.ts"
---

# Testing

- Keep tests next to source files.
- Use Vitest globals from the existing setup.
- For components, use Testing Library and query by role/text before `data-testid`.
- Keep setup in `src/config/setupTests.ts`.
- Prefer user-visible behavior over implementation details.
- Run `pnpm run test:run` for verification.
- Run `pnpm run coverage` when coverage thresholds or included files change.
