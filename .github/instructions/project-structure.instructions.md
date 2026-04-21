---
description: Repository structure, path aliases, naming, and package-level conventions.
applyTo: "package.json, tsconfig*.json, vite.config.ts, eslint.config.ts, src/**/*.{ts,tsx}"
---

# Project Structure

- Source lives in `src`.
- App entry: `src/main.tsx`; shell: `src/App.tsx`; routing: `src/router`.
- Route-level pages live in `src/pages`.
- Global Tailwind and CSS variables live in `src/styles/main.css`.
- Tests are co-located with source as `*.test.ts` or `*.test.tsx`.
- Use `@/` imports for local `src` modules.
- Avoid barrel `index.ts` files unless a folder has 3+ stable exports.
- Component filenames use PascalCase; hooks/utilities use camelCase.
- Keep generated outputs (`dist`, `coverage`, `node_modules`) out of source edits.
