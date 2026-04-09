# ESLint rules reference

Rules are grouped by category. Severity: `error` = always enforce, `warn` = migration-only, `off` = explicitly disabled with reason.

## TypeScript: type safety

| Rule | Default | Notes |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | `error` | Core rule; exceptions must be commented |
| `@typescript-eslint/no-unsafe-assignment` | `error` | Part of `recommendedTypeChecked` |
| `@typescript-eslint/no-unsafe-member-access` | `error` | Part of `recommendedTypeChecked` |
| `@typescript-eslint/no-unsafe-return` | `error` | Part of `recommendedTypeChecked` |
| `@typescript-eslint/no-unsafe-argument` | `error` | Part of `recommendedTypeChecked` |
| `@typescript-eslint/no-unsafe-call` | `error` | Part of `recommendedTypeChecked` |

## TypeScript: async safety

| Rule | Default | Notes |
|---|---|---|
| `@typescript-eslint/no-floating-promises` | `error` | Catches unawaited Promises silently discarded |
| `@typescript-eslint/await-thenable` | `error` | Prevents `await` on non-thenables |
| `@typescript-eslint/no-misused-promises` | `error` | Prevents async callbacks in non-async slots (e.g. `array.forEach`) |
| `@typescript-eslint/require-await` | `warn` | Useful but noisy during refactors |

## TypeScript: code quality

| Rule | Default | Notes |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | `error` | Use `{ argsIgnorePattern: "^_" }` for ignored params |
| `@typescript-eslint/consistent-type-imports` | `error` | Enforces `import type`; required for `verbatimModuleSyntax` |
| `@typescript-eslint/consistent-type-exports` | `error` | Aligns with `verbatimModuleSyntax` on exports |
| `@typescript-eslint/no-unnecessary-condition` | `warn` | Useful in strict mode; can be noisy with third-party types |
| `@typescript-eslint/prefer-nullish-coalescing` | `warn` | Suggest `??` over `\|\|` where types can be null/undefined |
| `@typescript-eslint/prefer-optional-chain` | `warn` | Suggest `a?.b` over `a && a.b` |
| `@typescript-eslint/no-non-null-assertion` | `warn` | Prefer explicit narrowing over `!` postfix |

## Preact / React hooks

| Rule | Default | Notes |
|---|---|---|
| `react-hooks/rules-of-hooks` | `error` | Never disable; signals architectural problem |
| `react-hooks/exhaustive-deps` | `error` | Fix missing deps; do not suppress without full understanding |
| `react/jsx-key` | `error` | Missing keys cause silent rendering bugs |
| `react/no-array-index-key` | `warn` | Use stable IDs for list keys in dynamic lists |
| `react/react-in-jsx-scope` | `off` | Not needed with Preact/React 17+ JSX transform |
| `react/prop-types` | `off` | TypeScript handles prop validation |

## Node.js / Netlify Functions

| Rule | Default | Notes |
|---|---|---|
| `n/no-process-exit` | `error` | Use `throw` or `return`; allows graceful shutdown |
| `n/no-missing-import` | `off` | TypeScript resolver handles this; node plugin duplicates it |
| `n/no-unsupported-features/es-syntax` | `error` | Catches syntax above the configured Node target |
| `no-console` | `off` in functions, `warn` in UI | Console is the logger in serverless; warn in frontend builds |

## General quality

| Rule | Default | Notes |
|---|---|---|
| `eqeqeq` | `error` | Always `===`; no `== null` exception needed with TypeScript |
| `no-var` | `error` | `const` / `let` only |
| `prefer-const` | `error` | Signals intentional mutability when `let` is used |
| `no-duplicate-imports` | `error` | Merge imports from the same module |
| `object-shorthand` | `error` | `{ name }` over `{ name: name }` |
| `no-throw-literal` | `error` | Always throw `Error` instances |

## Import order (with eslint-plugin-import or eslint-plugin-simple-import-sort)

```ts
import simpleSort from "eslint-plugin-simple-import-sort";

// In rules:
{
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
}
```

Group order:
1. Node built-ins (`node:fs`, `node:path`)
2. External packages
3. Internal path-aliased imports (`@/models/...`)
4. Relative imports

## Severity guidance

- Use `error` for rules that catch real bugs or enforce hard contracts.
- Use `warn` only during active migration periods. Set a deadline to promote to `error` or remove.
- Never leave `warn` as a permanent state — it becomes ignored noise.
- Use `off` with a comment when a rule conflicts with a deliberate architectural decision.
