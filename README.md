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

- `preact-ui` - component architecture, MVVM, signals, forms, routing, and professional UI patterns
- `vue-ui` - Vue 3 apps, SFC components, Pinia state, Vue Router, Vue I18n, Vite, and Vitest
- `scss-system` - design tokens, mixins, architecture, responsive theming
- `web-accessibility-standards` - accessible HTML, ARIA, WCAG implementation
- `a11y-review` - accessibility audits and QA
- `web-performance` - Core Web Vitals, image optimization, bundle splitting
- `web-i18n` - internationalization, RTL, locale-aware formatting
- `web-testing` - Playwright E2E, component tests, visual regression, CI reporting
- `storybook-ui` - Storybook setup, stories, interaction tests, accessibility, visual testing
- `web-seo-metadata` - route metadata, canonical URLs, social previews, sitemaps, structured data
- `web-forms` - accessible forms, validation, async submit states, error handling, spam resistance
- `web-data-fetching` - loading/error/empty states, cancellation, retry, cache invalidation, typed API boundaries
- `web-observability` - frontend errors, analytics events, Core Web Vitals, privacy-safe telemetry
- `web-deployment` - env vars, preview deploys, redirects, cache headers, SPA fallback, CI checks
- `web-auth-ux` - login, MFA, session expiry, password reset, role/permission UI, secure token handling
- `web-privacy` - consent management, cookie banners, opt-in/opt-out, data minimization, PII handling
- `web-content` - CMS integration, rich text safety, empty states, error pages, content schema
- `web-pwa` - installability, service workers, offline support, push notifications, app manifest
- `web-design-review` - design token alignment, spacing/typography/color review, responsive and dark mode checks
- `web-security` - XSS, CSP, session management, security headers
- `netlify-serverless` - current Netlify Functions and Edge model, auth, CORS, rate limiting, deployment patterns
- `netlify-typescript-api` - TypeScript API structure, `Request`/`Response` handlers, validation, response contracts
- `netlify-database-security` - runtime env secrets, least privilege, storage choices, safe database access
- `netlify-api-performance` - cold starts, query efficiency, cache strategy, regional observability
- `mongodb-netlify` - MongoDB Atlas on Netlify, connection reuse, pooling, Stable API, query safety
- `neon-netlify` - Neon and Netlify DB on Netlify, pooled Postgres access, branching, migration-safe workflows

- `frontend-ui` - React TSX page & component patterns, Tailwind v4 rules, layout prompts, testing coverage
- `project-tooling` - Vite, Vitest, TypeScript, ESLint, and build/test tooling guidance
- `docs-instructions` - guidance for repository docs, Copilot instructions, prompts, and LLM evals
- `vercel-deploy` - Vercel deployment, env var rules, SPA fallback, and preview verification

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
npx web-ui-skills-mcp
```

#### Client setup

Register the server in your MCP client using `stdio`:

```json
{
  "mcpServers": {
    "web-ui-skills": {
      "command": "npx",
      "args": ["web-ui-skills-mcp"],
      "env": {
        "WEB_UI_SKILLS_CLIENT": "codex"
      }
    }
  }
}
```

It exposes tools for `search_skills`, `list_groups`, `install_skills`, `update_skills`, and `remove_skills`.
It also exposes a `web-ui-skills://guide` resource and the `how-to-use-web-ui-skills`, `install-group-plan`, `update-skills-plan`, and `remove-skills-plan` prompts for concise usage guidance.
Set `WEB_UI_SKILLS_CLIENT` to `codex`, `claude`, `copilot`, or `kilo` so the server can tag responses and prompts with the active client.
Use it from an MCP client by wiring the command through standard `stdio`.

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
