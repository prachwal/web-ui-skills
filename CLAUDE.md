# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Web UI Skills** is a curated skills bundle for AI coding assistants (Claude, Copilot, Codex, Kilo). The bundle contains 40+ markdown-based skills covering web development topics: frontend frameworks, backend APIs, testing, accessibility, deployment, and more.

Each skill is a directory under `skills/` with:
- `SKILL.md` — frontmatter (name, description) + markdown content
- Additional files (examples, templates, images) as needed

The project also provides an MCP server that exposes skill installation and management as protocol tools.

## Commands

### Core Development

- **Install skills locally**: `npm run install-skills` — copies all skills to `~/.claude/skills` (+ Codex, Copilot, Kilo)
- **List skills**: `npm run list-skills` — shows all skills and structural warnings
- **MCP server**: `npm run mcp` — runs the MCP server for skill management via protocol

### Quality & Validation

- **Tests**: `npm test` — runs tests in `tests/` (install.test.js, mcp.test.mjs)
- **Lint markdown**: `npm run lint:md` — validates markdown syntax and format
- **Fix markdown**: `npm run lint:md:fix` — auto-fixes markdown issues
- **Check references**: `npm run check-md-refs` — validates internal markdown links

## Architecture

### Skill Structure

Each skill is a standalone directory:

```
skills/
  preact-ui/
    SKILL.md             # Skill content + frontmatter
    examples/            # Optional code examples, templates
    images/              # Optional diagrams, screenshots
  vue-ui/
  ...
  groups.json            # Predefined skill groups for batch install
```

**Frontmatter** in SKILL.md:
```yaml
---
name: preact-ui
description: "Use when designing Preact pages and components..."
---
```

### Skill Sources & Precedence

The installer discovers skills in this order (highest to lowest priority):

1. **Repo bundle** — `/skills/` (bundled skills)
2. **User overlay** — `~/.web-ui-skills/skills/` (or `$WEB_UI_SKILLS_USER_SOURCE`)
3. **Project overlay** — `./.web-ui-skills/skills/` (project-local overrides)

When the same skill exists in multiple places, the higher-precedence source wins.

### MCP Server (`bin/mcp.mjs`)

The MCP server runs via `npm run mcp` and exposes protocol tools for AI assistants:

- Tool registration for each skill
- Install/remove/list operations
- Supports all four tools (Codex, Claude, Copilot, Kilo)
- Uses environment variable `WEB_UI_SKILLS_CLIENT` to customize output

Dependencies: `@modelcontextprotocol/sdk` (v1.15+), `zod` (v4+)

## Key Files

| File | Purpose |
|------|---------|
| `bin/install.js` | Skill installer; resolves sources, copies to tool dirs |
| `bin/mcp.mjs` | MCP server; runs tools for skill management |
| `skills/` | All bundled skills (40+) |
| `groups.json` | Predefined skill groups (e.g., "ui", "backend") |
| `AGENTS.md` | Installation, configuration, and dev workflow for all tools |
| `CONTRIBUTING.md` | Contribution checklist |
| `tests/` | Unit tests for installer and MCP server |
| `scripts/` | Utility scripts (auth0, netlify, markdown reference check) |

## Adding or Modifying Skills

### Create a new skill

1. Create a directory under `skills/your-skill-name/`
2. Write `SKILL.md` with frontmatter and content (see `preact-ui/SKILL.md` as reference)
3. Add optional subdirectories (`examples/`, `images/`) as needed
4. Run `npm run list-skills` to verify the skill is discovered
5. Run `npm test` to validate structure
6. Run `npm run lint:md` to check markdown quality

### Modify existing skills

- Edit the skill's `SKILL.md` directly
- Run `npm run lint:md` and `npm test` to validate
- Run `npm run check-md-refs` to ensure links within the skill are correct

### Update skill groups

Edit `skills/groups.json` to bundle related skills:

```json
{
  "ui": ["preact-ui", "vue-ui", "frontend-ui"],
  "backend": ["netlify-serverless", "mongodb-netlify", "neon-netlify"]
}
```

Users can then install a group: `npx web-ui-skills group ui`

## Testing

### Run all tests

```bash
npm test
```

Uses Node's native test runner (`--test` flag).

### Test files

- `tests/install.test.js` — tests skill discovery, copy logic, tool directory resolution
- `tests/mcp.test.mjs` — tests MCP server tool registration and installation flow

## Conventions

- **Skill names**: lowercase, hyphenated (e.g., `preact-ui`, `netlify-serverless`)
- **Commit messages**: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Markdown**: validated by markdownlint; autofix with `npm run lint:md:fix`
- **Node version**: >= 16

## Installation & Distribution

The bundle is published to npm as `web-ui-skills`. Users install via:

```bash
npx web-ui-skills                    # to all supported tools
npx web-ui-skills --claude --codex   # to specific tools
npx web-ui-skills preact-ui          # specific skills only
```

Version bumps and releases are handled through `package.json` and follow semver.
