---
description: ESLint flat-config rules for repository tooling.
applyTo: "eslint.config.ts, package.json, src/**/*.{ts,tsx}"
---

# ESLint

- ESLint uses flat config in `eslint.config.ts`; do not add `.eslintrc.*`.
- Keep global ignores as a standalone object with only `ignores`.
- Use `@eslint/js` recommended config and `typescript-eslint` recommended config.
- Before adding a plugin, verify it supports flat config.
- Keep generated outputs ignored: `dist/`, `coverage/`, `node_modules/`.
- Run `pnpm run lint` after changing lint config or broad TypeScript rules.
