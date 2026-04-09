---
name: eslint-config
description: Use when setting up, extending, or fixing ESLint configuration for TypeScript projects, including flat config, Preact/React, Node.js, Netlify Functions, and monorepo variants. Covers rule selection, plugin integration, and CI enforcement.
---

# ESLint Config Skill

Use this skill when a project needs ESLint set up from scratch, migrated to flat config, extended for a specific runtime or framework, or when existing rules are too noisy or too permissive.

## Core principles

1. Use flat config (`eslint.config.ts` / `eslint.config.js`) for all new projects. Legacy `.eslintrc` is deprecated as of ESLint v9.
2. Enable TypeScript-aware rules via `typescript-eslint`. Do not configure TypeScript rules without it.
3. Layer configs: base TypeScript → framework → project-specific overrides. Keep each layer small.
4. Treat `warn` as `error` in CI — warnings that never block are noise. Use `warn` only for rules in active migration.
5. Never disable rules globally without a comment explaining why.

## Base flat config (TypeScript)

```ts
// eslint.config.ts
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/", "node_modules/", "coverage/", ".netlify/"],
  },
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "no-console": "warn",
    },
  },
);
```

## Preact / React variant

```ts
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  tseslint.configs.recommendedTypeChecked,
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    settings: {
      react: { version: "detect" },
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        jsxPragma: null, // for Preact: no React import needed
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",       // Preact / React 17+ JSX transform
      "react/prop-types": "off",               // TypeScript handles this
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
    },
  },
);
```

## Node.js / Netlify Functions variant

```ts
import tseslint from "typescript-eslint";
import nodePlugin from "eslint-plugin-n";

export default tseslint.config(
  { ignores: ["dist/", ".netlify/", "node_modules/"] },
  tseslint.configs.recommendedTypeChecked,
  nodePlugin.configs["flat/recommended-module"],
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "n/no-missing-import": "off",   // TypeScript resolves imports; node plugin duplicate
      "no-console": "off",            // console is the logger in serverless functions
    },
  },
);
```

## Monorepo: shared base + per-package overrides

```
packages/
  eslint-config-base/
    index.ts        ← shared base config exported as a package
  app-ui/
    eslint.config.ts
  api/
    eslint.config.ts
```

```ts
// packages/eslint-config-base/index.ts
import tseslint from "typescript-eslint";
export const base = tseslint.configs.recommendedTypeChecked;
export const strictRules = {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
} as const;
```

```ts
// packages/api/eslint.config.ts
import tseslint from "typescript-eslint";
import { base, strictRules } from "@repo/eslint-config-base";

export default tseslint.config(
  { ignores: ["dist/"] },
  ...base,
  {
    languageOptions: { parserOptions: { project: true, tsconfigRootDir: import.meta.dirname } },
    rules: { ...strictRules, "no-console": "off" },
  },
);
```

## Recommended rules reference

| Rule | Reason |
|---|---|
| `@typescript-eslint/no-explicit-any` | Enforce type safety |
| `@typescript-eslint/no-floating-promises` | Catch unawaited async calls |
| `@typescript-eslint/await-thenable` | Prevent `await` on non-Promises |
| `@typescript-eslint/no-unused-vars` | Keep code clean |
| `@typescript-eslint/consistent-type-imports` | Align with `verbatimModuleSyntax` |
| `@typescript-eslint/no-misused-promises` | Prevent async callbacks in sync slots |
| `react-hooks/rules-of-hooks` | Enforce Hooks contract |
| `react-hooks/exhaustive-deps` | Prevent stale closures in hooks |
| `n/no-process-exit` | Avoid abrupt process termination in libraries |

## Disabling rules

```ts
// Inline — always add a reason
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- third-party SDK returns any
const result = sdk.call() as any;

// File-level — above all code, always add a reason
/* eslint-disable no-console -- CLI tool; console is the intended output */
```

Never disable `@typescript-eslint/no-floating-promises` without a reason — it hides real async bugs.

## CI enforcement

```json
// package.json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

- Run `lint` (not `lint:fix`) in CI to fail on violations.
- In CI, add `--max-warnings 0` to treat all warnings as failures: `eslint . --max-warnings 0`.
- Cache `.eslintcache` between CI runs to speed up incremental checks.

## Migration from .eslintrc

1. Remove `.eslintrc.*` and `eslintConfig` from `package.json`.
2. Uninstall `@eslint/eslintrc` if it was a direct dependency.
3. Install `eslint@^9` and `typescript-eslint@^8`.
4. Create `eslint.config.ts` using the flat config shape above.
5. Run `eslint .` and fix new violations — `recommendedTypeChecked` is stricter than `recommended`.
6. Remove legacy `parser`, `parserOptions.ecmaVersion`, and `env` keys — flat config handles these differently.

## References

Local reference files:
- [references/rules.md](references/rules.md): annotated rule list by category with severity guidance
- [references/presets.md](references/presets.md): ready-to-copy presets for TypeScript, Preact, Node, and monorepo

ESLint docs:
- [Flat config migration guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [typescript-eslint getting started](https://typescript-eslint.io/getting-started/)
- [typescript-eslint rule list](https://typescript-eslint.io/rules/)
- [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)
- [eslint-plugin-n](https://github.com/eslint-community/eslint-plugin-n)
