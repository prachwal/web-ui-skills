---
description: React TSX component and page conventions for this Vite app.
applyTo: "src/**/*.tsx"
---

# React Components

- Use function components with explicit prop types when props are non-trivial.
- Keep route pages in `src/pages` and shared pieces in `src/components` if reused.
- Prefer named helper components inside a page until reuse justifies extraction.
- Use semantic HTML: `main`, `section`, `article`, `aside`, `nav`, `ul`, `ol`, and `dl` where appropriate.
- Interactive controls need visible focus styles and a 40px+ touch target.
- Use `<a href>` for navigation and `<button type="button">` for local actions.
- Use `@/` imports for local modules.
- Avoid `dangerouslySetInnerHTML` unless the task explicitly requires trusted HTML handling.
- Page-level UI needs one clear focal point and believable product/content proof.
- For substantial page creation or redesign, load `.github/prompts/frontend-layout-playbook.prompt.md`.
- For full-page skeleton selection, load `.github/prompts/page-pattern-catalog.prompt.md`.
