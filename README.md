# Web UI Skills Bundle

![GitHub version](https://img.shields.io/github/v/release/prachwal/web-ui-skills)
![npm version](https://img.shields.io/npm/v/web-ui-skills)

This repository bundles Codex skills for building professional web applications.

## Quick Start

- **[Installation Guide](AGENTS.md#installation)** - How to install skills for your AI tools
- **[Agent Configuration](AGENTS.md#agent-configuration)** - Configure Claude, Copilot, Codex, and Kilo
- **[Contributing](AGENTS.md#development-workflow)** - How to contribute new skills
- **[Repository Guidelines](AGENTS.md#repository-structure)** - Understanding the project structure

## Included skills

### Foundation

- `typescript-fundamentals` - TypeScript code structure, type safety, patterns, naming, formatting, and module organization.
- `eslint-config` - ESLint configuration for TypeScript projects, including flat config, Preact/React, Node.js, Netlify Functions, and monorepos.
- `project-tooling` - Vite, Vitest, TypeScript, ESLint, package scripts, path aliases, and build/test tooling.
- `docs-instructions` - repository Markdown, Copilot instructions, Codex AGENTS.md, repo skills, prompts, and LLM eval tasks.

### UI

- `preact-ui` - Preact pages and components, MVVM architecture, signals, hooks, forms, routing, data fetching, accessibility, SCSS integration, and tests.
- `vue-ui` - Vue 3 applications and components, Composition API, SFC structure, Pinia state, Vue Router, Vue I18n, Vite, Vitest, Vue Test Utils, accessibility, and production app architecture.
- `scss-system` - SCSS-based design systems, component libraries, tokens, mixins, functions, color palettes, typography, spacing, responsiveness, theming, and folder architecture.
- `storybook-ui` - Storybook setup, CSF stories, interaction tests, Vitest addon, accessibility, visual testing, and component documentation workflows.
- `frontend-ui` - React TSX pages and components, Tailwind v4 styling, accessibility, and Testing Library coverage.

### Quality

- `web-accessibility-standards` - accessible web interfaces, semantic HTML, ARIA, keyboard support, responsive mobile-first layouts, focus management, dynamic content, and automated accessibility checks.
- `a11y-review` - accessibility reviews for WCAG mapping, ARIA misuse, keyboard access, focus management, responsive/mobile behavior, and QA findings.
- `web-testing` - web UI test strategy, Playwright end-to-end tests, regression coverage, stable locators, visual comparisons, browser compatibility, progressive enhancement, and CI reporting.
- `web-design-review` - visual design implementation against design specs, including spacing, typography, color, responsive behavior, component consistency, dark mode, and token alignment.

### Frontend Product

- `web-performance` - web app performance, Core Web Vitals, loading speed, rendering, asset delivery, code splitting, caching, and image optimization.
- `web-i18n` - internationalized web UIs, locale-aware formatting, language tags, directionality, RTL layouts, pluralization, and translatable copy.
- `web-seo-metadata` - SEO, route metadata, social previews, robots directives, sitemaps, canonical URLs, and structured data.
- `web-forms` - accessible forms, validation, error messaging, pending and success states, async submit flows, spam resistance, and form tests.
- `web-data-fetching` - frontend data fetching, loading/error/empty states, retry, cancellation, cache invalidation, optimistic updates, and typed API boundaries.
- `web-observability` - frontend observability, error reporting, analytics events, Core Web Vitals collection, logging, privacy-safe telemetry, and release diagnostics.
- `web-deployment` - frontend web app deployment, environment variables, preview deploys, redirects, cache headers, SPA fallback, static assets, CI gates, and release checks.
- `web-auth-ux` - login, registration, password reset, MFA, session expiry, role/permission UI flows, secure token handling, and auth error recovery.
- `web-privacy` - consent management, cookie banners, analytics opt-in/out, tracking controls, data minimization, privacy-safe telemetry, and compliance-aware frontend patterns.
- `web-content` - content-heavy pages, CMS integrations, editorial workflows, empty states, error pages, marketing pages, rich text rendering, and content safety.
- `web-pwa` - installability, service workers, offline support, background sync, push notifications, and app manifest configuration.
- `web-security` - frontend security concerns, XSS prevention, safe rendering, CSP, CSRF awareness, token handling, secure storage, and secure links/forms.

### Platform

- `netlify-serverless` - Netlify Functions, Edge Functions, Background and Scheduled Functions, runtime capabilities, routing primitives, and deployment-time constraints.
- `netlify-typescript-api` - TypeScript API structure, `Request`/`Response` handlers, validation, response contracts, and testable request/response flow.
- `netlify-database-security` - runtime env secrets, least privilege, safe data access patterns, and storage choices for Netlify-connected databases.
- `netlify-api-performance` - Netlify backend API speed, cost, cold starts, database efficiency, caching, regional behavior, and observability.
- `netlify-cli` - Netlify CLI workflows for managing the full lifecycle of applications.
- `mongodb-netlify` - MongoDB Atlas or MongoDB-compatible deployments on Netlify, connection reuse, pooling, Stable API, query safety, and serverless patterns.
- `neon-netlify` - Neon Postgres on Netlify, branching workflows, pooled connections, query safety, and operational patterns.
- `vercel-deploy` - Vercel deployment behavior, env vars, SPA fallback routing, and production build settings.
- `vercel-endpoints` - Vercel API endpoints, route handlers, SPA fallback routing, Bun runtime configuration, local development with `vercel dev`, and deployment debugging.

## Install

### npx (recommended)

Install skills for all supported tools at once:

```bash
npx web-ui-skills
```

Or target specific tools:

```bash
npx web-ui-skills --codex      # ~/.codex/skills
npx web-ui-skills --claude     # ~/.claude/skills
npx web-ui-skills --copilot    # ~/.copilot/skills
npx web-ui-skills --kilo       # ~/.kilocode/skills

npx web-ui-skills --codex --claude   # multiple tools at once
npx web-ui-skills --project --codex preact-ui   # ./.codex/skills in the current project
```

Additional options:

```bash
npx web-ui-skills list   # show detected skills and structural warnings
npx web-ui-skills groups   # list predefined skill groups
npx web-ui-skills find ui   # search skills by folder or frontmatter name
npx web-ui-skills preact-ui vue-ui   # install only selected skills
npx web-ui-skills group ui   # install a predefined group of skills
npx web-ui-skills remove vue-ui    # remove selected skills from the target tool dir
npx web-ui-skills remove --all vue-ui    # remove vue-ui from all tool dirs
npx web-ui-skills remove --all --everything # remove all installed skills from all tool dirs
npx web-ui-skills --help   # show help
```

### Local skill overlay

You can keep user-owned skill sources independent from the bundled repo under `~/.web-ui-skills/skills`.
Project-local overlays live in `./.web-ui-skills/skills` inside the current project.
Set `WEB_UI_SKILLS_USER_SOURCE` to point the user overlay at another directory.

Source precedence is:

`repo bundle -> user overlay -> project overlay`

When the same skill or group exists in multiple places, the higher-precedence overlay wins.

### Update existing installation

To update skills to the latest version:

```bash
npx web-ui-skills@latest
```

Or reinstall from source:

```bash
cd /path/to/web-ui-skills
npm run install-all  # installs to all supported tool directories
```

### Verify installation

Check if skills are properly installed:

```bash
# For Codex
ls ~/.codex/skills/ | grep web-

# For Claude
ls ~/.claude/skills/ | grep web-

# For Copilot
ls ~/.copilot/skills/ | grep web-
```

### Shell script (legacy)

Run the installer from the repository root:

```bash
./install.sh
```

By default, skills are copied to `${CODEX_HOME:-$HOME/.codex}/skills`.

### Manual installation

Clone the repository and run the installer:

```bash
git clone https://github.com/prachwal/web-ui-skills.git
cd web-ui-skills
npm install
node bin/install.js --codex --claude --copilot --kilo
```

### MCP server

#### Installation

For local development from this repository:

```bash
npm install
npm run mcp
```

If you want to run the published CLI directly:

```bash
npx web-ui-skills mcp
```

#### Client setup

Register the server in your MCP client using a JSON `mcpServers` block over `stdio`.

Global Codex setup:

```json
{
  "mcpServers": {
    "web-ui-skills": {
      "command": "npx",
      "args": ["web-ui-skills", "mcp"],
      "env": {
        "WEB_UI_SKILLS_CLIENT": "codex"
      }
    }
  }
}
```

Another client, for example Claude, uses the same shape:

```json
{
  "mcpServers": {
    "web-ui-skills": {
      "command": "npx",
      "args": ["web-ui-skills", "mcp"],
      "env": {
        "WEB_UI_SKILLS_CLIENT": "claude"
      }
    }
  }
}
```

Project-local install through MCP uses tool arguments, not the client config:

```json
{
  "tools": ["codex"],
  "groups": ["ui"],
  "project": true,
  "projectRoot": "/path/to/project"
}
```

That writes into `./.codex/skills` inside the project instead of `~/.codex/skills`.

A ready-to-use file for Codex is available at [examples/codex-mcp-config.json](/home/prachwal/src/docs/web-ui-skills/examples/codex-mcp-config.json), and a generic template is available at [examples/mcp-config.json](/home/prachwal/src/docs/web-ui-skills/examples/mcp-config.json).

It exposes tools for `search_skills`, `list_groups`, `install_skills`, `update_skills`, and `remove_skills`.
It also exposes `get_skill_info`, `get_group_info`, and `list_skills_info` for inspecting skill and group metadata before installing anything.
It also exposes `list_overlays` for checking the repo, user, and project overlay sources before merging or installing.
It also exposes `sync_overlays` for writing the merged overlay view into the user or project overlay directory.
It also exposes a `web-ui-skills://guide` resource and the `how-to-use-web-ui-skills`, `install-group-plan`, `update-skills-plan`, and `remove-skills-plan` prompts for concise usage guidance.
Set `WEB_UI_SKILLS_CLIENT` to `codex`, `claude`, `copilot`, or `kilo` so the server can tag responses and prompts with the active client.
Pass `project: true` and `projectRoot` in MCP calls when you want the skills copied into the current project instead of global user folders.
Use it from an MCP client by wiring the command through standard `stdio` and the JSON config above.

MCP tools and what they do:

- `search_skills` - find skills by folder name or frontmatter name.
- `list_groups` - inspect curated groups and their included skills.
- `list_overlays` - inspect repo, user, and project overlay sources and precedence.
- `sync_overlays` - materialize the merged overlay view into the user or project overlay directory.
- `get_skill_info` - inspect one skill with full metadata.
- `get_group_info` - inspect one group with full skill metadata.
- `list_skills_info` - list all skills with full metadata.
- `install_skills` - install selected skills or groups to one or more tools.
- `update_skills` - refresh installed skills for one or more tools.
- `remove_skills` - remove selected skills, groups, or everything for a selected tool scope.

## CI/CD

This repository supports both GitHub Actions and GitLab CI/CD:

- **GitHub Actions**: Automated releases and NPM publishing
- **GitLab CI**: Comprehensive testing, building, and deployment pipeline

See [.gitlab-ci.yml](.gitlab-ci.yml) for the complete GitLab CI configuration.

## Version prep

For a new release:

1. Bump `package.json` and `package-lock.json` together.
2. Keep the release notes focused on the skills bundle and installer changes.
3. Avoid adding secrets or registry credentials to the repository.
4. Let the automation handle the patch bump and release from `main`.

## Local test

```bash
CODEX_HOME=/tmp/web-ui-skills-test-home node bin/install.js --codex
CODEX_HOME=/tmp/web-ui-skills-test-home ./install.sh --codex
CODEX_HOME=/tmp/web-ui-skills-test-home node bin/install.js --codex preact-ui vue-ui
CODEX_HOME=/tmp/web-ui-skills-test-home node bin/install.js --codex --group ui
CODEX_HOME=/tmp/web-ui-skills-test-home node bin/install.js --codex remove vue-ui
```

Run `npx web-ui-skills --list` to inspect the bundle without installing anything.

## Notes

- `web-accessibility-standards` covers implementation work.
- `a11y-review` covers audits and QA.
- `preact-ui`, `vue-ui`, `scss-system`, and `storybook-ui` cover component architecture, styling, and UI documentation.
- `web-performance`, `web-i18n`, `web-testing`, `web-security`, `web-seo-metadata`, `web-forms`, `web-data-fetching`, `web-observability`, and `web-deployment` cover production frontend concerns.
- `web-auth-ux`, `web-privacy`, `web-content`, `web-pwa`, and `web-design-review` cover specialized product and compliance workflows.
- `netlify-serverless`, the Netlify API skills, `mongodb-netlify`, and `neon-netlify` cover backend, database, and operational concerns.

## Contributing

We welcome contributions! Please see [AGENTS.md](AGENTS.md) for detailed contribution guidelines, including:

- How to add new skills
- Code standards and conventions
- Testing requirements
- Pull request process

### Repository Principles

- **Quality First**: All skills must be thoroughly tested and follow best practices
- **Consistency**: Maintain uniform structure and documentation across all skills
- **Accessibility**: Include accessibility considerations in all UI-related skills
- **Performance**: Consider bundle size and runtime performance implications
- **Standards**: Prefer web standards and cross-platform compatibility

### Limitations

- Skills are focused on modern web development practices
- No platform-specific code without clear cross-platform alternatives
- Content must be original or properly licensed
- Skills should remain relevant as technologies evolve
