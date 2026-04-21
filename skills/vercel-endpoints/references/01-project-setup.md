# Project setup (practical checklist)

This checklist covers a working Bun + TypeScript + Vercel Functions project structure used in example apps.

- Create repository root files: `package.json`, `bun.lock` (if using Bun), `tsconfig.json`, `vercel.json`.
- Place serverless functions under `/api` at the project root — every `.ts` file becomes a function.
- Keep SPA client code in `src/` and emit a static output directory (commonly `dist`) used by Vercel for static assets.
- Useful `package.json` scripts: `dev`, `build`, `preview`, `type-check`, `test`, `test:coverage`, `lint`, `lint:fix`, `format`.
- Vite + Bun notes:
  - Use `vite.config.ts` with `@vitejs/plugin-react` and `@tailwindcss/vite` when using Tailwind v4.
  - Alias `@` → `./src` in Vite and mirror the alias in test config so imports work in Vitest.
- Keep build output and CI ignores: `dist/`, `coverage/`, `node_modules/`.
- Validate locally:
  - `pnpm install` or `bun install` depending on runtime
  - `pnpm build` (or `bun run build`) produces `dist/`
  - `pnpm run type-check` (TypeScript strict mode)

See `vercel.json` reference for rewrites and caching.
