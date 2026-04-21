---
name: frontend-ui
description: Guidance for building, redesigning, or reviewing React TSX pages/components, Tailwind v4 styling, accessibility, and Testing Library coverage.
---

# Frontend UI

Start with matching instruction files for the repository's component and styling conventions:

- React/TSX component conventions (match your `.github/instructions/react-components.instructions.md`).
- Tailwind CSS v4 styling conventions (match your `.github/instructions/styling-tailwind.instructions.md`).

Load on demand:

- `.github/prompts/premium-page-brief.prompt.md` to turn a vague request into a buildable page brief.
- `.github/prompts/frontend-layout-playbook.prompt.md` for page-level design/refactor.
- `.github/prompts/page-pattern-catalog.prompt.md` only when choosing a full-page skeleton.
- `.github/prompts/content-realism.prompt.md` when copy or product proof feels generic.
- `.github/prompts/theme-palette-system.prompt.md` when adding or reviewing palettes.
- `.github/prompts/visual-assets-direction.prompt.md` when choosing hero media or visual assets.
- `.github/prompts/responsive-visual-qa.prompt.md` after substantial layout changes.
- `.github/prompts/premium-layout-review.prompt.md` before finalizing a page.

Rules:

- Keep Tailwind v4 CSS-first. Do not add `tailwind.config.js`.
- Preserve semantic theme utilities from `src/styles/main.css`.
- Prefer focused component/page edits over broad refactors.
- Treat hero pages in this repo as test surfaces for instruction quality, not as product presentation.
- Verify with `pnpm run test:run`; add `pnpm run build` for broad page or routing changes.
