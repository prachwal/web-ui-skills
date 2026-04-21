---
description: Markdown standards for repository documentation, prompts, agents, and instructions.
applyTo: "**/*.md"
---

# Markdown

- Prefer updating an existing Markdown file over creating a new one.
- Use descriptive kebab-case filenames.
- Use one H1, then non-skipping ATX headings.
- Add a language to fenced code blocks; use `text` for plain output.
- Use compact bullets and keep lines readable.
- Keep instruction files short; move detailed examples to `.github/prompts`.
- Run `pnpm run lint:md` after Markdown-heavy edits.
