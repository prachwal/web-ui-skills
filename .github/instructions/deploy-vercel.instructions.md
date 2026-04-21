---
description: Vercel deployment config and environment-variable rules.
applyTo: "vercel.json, .vercelignore, package.json, src/**/*.ts, src/**/*.tsx"
---

# Vercel

- Build command is `pnpm run build`; output directory is `dist`.
- SPA fallback should route non-asset paths to `index.html`.
- Public browser variables must use `VITE_`.
- Never put secrets in `VITE_` variables.
- Keep local `.env*` files out of commits unless they are templates without secrets.
- Test deployment-related changes with `pnpm run build`.
