---
name: vite-config
description: Use when changing Vite configuration, Vue plugin setup, aliases, env variables and modes, dev proxying, build output, TypeScript globals, static assets, or Vercel output alignment in Vite apps.
---

# Vite Config

Use this skill for Vite + Vue + TypeScript configuration work.

## Repo Fit

- This project keeps Vite source root at `src/frontend` and build output at repo root `dist/`.
- Keep Vercel `outputDirectory` aligned with `dist/`.
- Keep aliases consistent across `vite.config.ts` and TypeScript `paths`: `@/` for frontend and `@shared/` for shared contracts.
- Keep `publicDir` pointed at the repo `public/` directory when the app root is moved.
- Keep `@vitejs/plugin-vue` as the Vue SFC compiler plugin.

## Env Rules

- Client-exposed values must use `VITE_` keys in `.env` files.
- Do not expose secrets with `VITE_`; server-only secrets such as `DATABASE_URL` stay out of frontend bundles.
- This repo maps `VITE_NAME=value` to compile-time `__NAME__` globals through Vite `define`.
- Add or update declarations in `src/frontend/env.d.ts` whenever a new `__NAME__` global is introduced.
- Values injected through `define` must be JSON-serializable strings or identifiers; use `JSON.stringify(value)` for strings.
- Remember that Vite env values are strings unless explicitly parsed.

## Config Workflow

- Start from `createViteConfig({ mode })`; keep it testable rather than inlining all config into `defineConfig()`.
- Use `loadEnv(mode, process.cwd(), 'VITE_')` for client-safe env values.
- Use absolute filesystem paths for aliases and relocated roots.
- Preserve the commit label fallback order: CI commit env first, then local short SHA, then `local`.
- Keep dev proxy paths explicit; this repo proxies `/api` to the local Vercel dev server.
- Avoid broad proxy rewrites unless the API path contract changes.

## Build Guidance

- Prefer Vite defaults unless the repo has a concrete deployment or compatibility need.
- Vite's modern build target defaults to a Baseline Widely Available browser set; only override `build.target` for a known support requirement.
- Keep `build.emptyOutDir` intentional when `outDir` is outside the app root.
- Do not move output into `src/frontend/dist`; deployment and README expect root `dist/`.
- Keep static assets that need no transform in `public/`; import transformed assets from source.

## TypeScript And Tests

- Update `tsconfig.app.json` paths when adding or changing aliases.
- Keep `resolveJsonModule` if source imports shared JSON demo data.
- Test exported config helpers when changing mode/env behavior.
- Avoid config changes that make `vue-tsc -b` and Vite disagree about import resolution.

## Verification

- Run `npm run build` after any Vite config, alias, env, asset, or output path change.
- Run `npm test -- --run vite.config` if config tests exist or are added.
- For dev proxy changes, verify with `npm run dev:full` or the repo's documented local flow.
