---
description: Tailwind CSS v4 and project theme rules for CSS and styled TSX edits.
applyTo: "src/styles/**/*.css, src/**/*.css, src/**/*.scss, src/**/*.tsx"
---

# Tailwind and Styling

- Tailwind is v4 CSS-first: `@import "tailwindcss";`.
- Use `@tailwindcss/vite`; do not create `tailwind.config.js` or PostCSS config.
- Runtime theme variables live in `:root` and `[data-theme='dark']`.
- Map runtime variables through `@theme inline`; avoid `--color-*` self-references.
- Use semantic utilities such as `bg-bg`, `bg-surface`, `text-primary`, `text-secondary`, `border-default`, and `text-accent`.
- Use `dark:` only for intentional theme-specific overrides.
- Use opacity modifiers like `bg-white/10`; do not use v3 `bg-opacity-*`.
- Keep mobile base styles first, then `sm:`, `md:`, `lg:` overrides.
- Preserve visible `focus-visible` styles on interactive elements.
- For full page visual direction, load `.github/prompts/frontend-layout-playbook.prompt.md`.
