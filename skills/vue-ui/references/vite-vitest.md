# Vue With Vite And Vitest

## Vite

Use Vite and the official Vue plugin for new Vue apps:

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
})
```

Use `npm create vue@latest`, `pnpm create vue@latest`, or the repository's package manager equivalent for new projects.

## Type Checking

- Use `vue-tsc --noEmit` in CI to type-check Single-File Components.
- Keep `strict` TypeScript settings unless the repo has a documented migration reason.
- Prefer typed props, emits, and service contracts over runtime-only assumptions.

## Vitest

Use Vitest for unit and component tests in Vite-based apps:

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

## Vue Test Utils

Use `@vue/test-utils` to mount components and assert user-visible behavior:

- Render states: loading, error, empty, success.
- User events: click, input, submit, keyboard navigation.
- Props and emits: validate public component contracts.
- Router/i18n/store integration: mount with real plugins when behavior depends on them.

## CI Checks

Use project scripts equivalent to:

- `vue-tsc --noEmit`
- `vitest run`
- `vite build`
- `eslint .`

Keep test setup central in `src/test/` and mock the service layer instead of component internals.
