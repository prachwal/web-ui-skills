---
name: vercel-deploy
description: Use when editing Vercel configuration, deployment behavior, SPA fallback routing, environment variable usage, or production build settings.
---

# Vercel Deploy

Read first:

- `.github/instructions/deploy-vercel.instructions.md`
- `.github/instructions/tooling-vite-vitest.instructions.md`

Rules:

- Build with `pnpm run build` and verify production preview for routing issues.
- Keep browser-exposed variables under `VITE_` only when they are safe to expose.
- Never put secrets in client-side env variables.
- For routing issues, verify refresh behavior on nested routes after build/preview.
