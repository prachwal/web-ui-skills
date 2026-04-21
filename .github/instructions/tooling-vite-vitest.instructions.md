---
description: Vite and Vitest configuration rules for this React/Tailwind project.
applyTo: "vite.config.ts, vitest.config.ts, package.json, tsconfig*.json"
---

# Vite and Vitest

- Use `defineConfig` from `vitest/config` when Vitest is inline in `vite.config.ts`.
- Keep `tailwindcss()` before `react()` in the Vite plugin array.
- Keep the `@` alias mapped to `src`.
- Test environment is `jsdom`; setup file is `src/config/setupTests.ts`.
- Test globs are `src/**/*.{test,spec}.{ts,tsx}`.
- Use `pnpm run test:run` for non-watch test runs.
- Coverage uses V8 and writes to `coverage`.
- Do not add a separate `vitest.config.ts` unless inline config becomes a real blocker.
- Do not add PostCSS config for Tailwind in Vite.
