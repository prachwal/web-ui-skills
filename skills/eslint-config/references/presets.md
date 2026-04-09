# ESLint presets

Ready-to-copy `eslint.config.ts` starters for common project types.

## Prerequisites

```bash
# All variants
npm install -D eslint typescript-eslint

# Preact/React variant
npm install -D eslint-plugin-react eslint-plugin-react-hooks

# Node / Netlify Functions variant
npm install -D eslint-plugin-n

# Import sorting
npm install -D eslint-plugin-simple-import-sort
```

---

## Preset: TypeScript library or CLI

```ts
// eslint.config.ts
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "coverage/"] },
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "prefer-const": "error",
      "eqeqeq": "error",
      "no-var": "error",
    },
  },
);
```

---

## Preset: Preact app (Vite)

```ts
// eslint.config.ts
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  tseslint.configs.recommendedTypeChecked,
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "simple-import-sort": simpleSort,
    },
    settings: { react: { version: "detect" } },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        jsxPragma: null,
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
    },
  },
);
```

---

## Preset: Netlify Functions (Node.js)

```ts
// eslint.config.ts
import tseslint from "typescript-eslint";
import nodePlugin from "eslint-plugin-n";

export default tseslint.config(
  { ignores: ["dist/", ".netlify/", "node_modules/"] },
  tseslint.configs.recommendedTypeChecked,
  nodePlugin.configs["flat/recommended-module"],
  {
    languageOptions: {
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "n/no-missing-import": "off",
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
);
```

---

## Preset: monorepo root (Turborepo / pnpm workspaces)

```ts
// eslint.config.ts (workspace root — applies to all packages)
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/",
      "**/node_modules/",
      "**/.netlify/",
      "**/coverage/",
    ],
  },
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: [
          "./tsconfig.json",
          "./packages/*/tsconfig.json",
          "./apps/*/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
    },
  },
);
```

Each package can extend this root config and add framework-specific plugins locally.

---

## CI script additions

```json
// package.json
{
  "scripts": {
    "lint": "eslint .",
    "lint:ci": "eslint . --max-warnings 0"
  }
}
```

Run `lint:ci` in pull request pipelines. Run `lint` locally for faster feedback with warnings visible.
