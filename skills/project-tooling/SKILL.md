---
name: project-tooling
description: Tooling guidance for Vite, Vitest, TypeScript, ESLint, package scripts, path aliases, and build/test tooling.
---

# Project Tooling

Start with matching instruction files for the repository's tooling:

- Vite and Vitest configuration guidance (see `.github/instructions/tooling-vite-vitest.instructions.md`).
- ESLint flat-config guidance (see `.github/instructions/tooling-eslint.instructions.md`).
- Project structure and path aliasing guidance (see `.github/instructions/project-structure.instructions.md`).

Rules:

- Use `pnpm` for package management and scripts.
- Prefer inline Vitest config in `vite.config.ts` unless a separate config is required.
- Keep ESLint flat config in `eslint.config.ts` and check plugin compatibility before adding rules.
- Verify changes with `pnpm run typecheck`, `pnpm run test:run`, and `pnpm run build` as appropriate.
