---
name: docs-instructions
description: Use when maintaining repository Markdown, Copilot instructions, Codex AGENTS.md, repo skills, prompts, or LLM evaluation tasks.
---

# Docs and Instructions

Read first:

- `.github/instructions/docs-markdown.instructions.md`
- `.github/copilot-instructions.md`
- `AGENTS.md`

Organization rules:

- Keep always-loaded instructions short and durable.
- Put heavyweight examples, skeletons, and eval tasks in `.github/prompts`.
- Put Codex task routers in `.agents/skills/*/SKILL.md`.
- Do not duplicate content across Copilot instructions, prompts, and skills; cross-reference instead.
- Verify Markdown with `pnpm run lint:md`.
