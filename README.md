# Web UI Skills Bundle

This repository bundles Codex skills for building professional web applications.

## Included skills

- `preact-ui` - component architecture, MVVM, signals, forms, routing, and professional UI patterns
- `scss-system` - design tokens, mixins, architecture, responsive theming
- `web-accessibility-standards` - accessible HTML, ARIA, WCAG implementation
- `a11y-review` - accessibility audits and QA
- `web-performance` - Core Web Vitals, image optimization, bundle splitting
- `web-i18n` - internationalization, RTL, locale-aware formatting
- `web-testing` - Playwright E2E, component tests, visual regression, CI reporting
- `web-security` - XSS, CSP, session management, security headers

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
npx web-ui-skills --list   # show available skills
npx web-ui-skills --help   # show help
```

### Shell script (legacy)

Run the installer from the repository root:

```bash
./install.sh
```

By default, skills are copied to `${CODEX_HOME:-$HOME/.codex}/skills`.

## Release publishing

This repo publishes to npm from GitHub Releases using Trusted Publishing. Configure `web-ui-skills` as a trusted publisher in npmjs.com with the GitHub Actions workflow filename `.github/workflows/npm-publish.yml`. Create a release with a tag that matches the package version, for example `v1.0.1`. The workflow validates that the release tag and `package.json` version match, then publishes without an npm token secret.

## Local test

```bash
CODEX_HOME=/tmp/web-ui-skills-test-home node bin/install.js --codex
CODEX_HOME=/tmp/web-ui-skills-test-home ./install.sh --codex
```

Run `npx web-ui-skills --list` to inspect the bundle without installing anything.

## Notes

- `web-accessibility-standards` covers implementation work.
- `a11y-review` covers audits and QA.
- `preact-ui` and `scss-system` cover component and styling architecture.
- `web-performance`, `web-i18n`, `web-testing`, and `web-security` cover the remaining production concerns.
