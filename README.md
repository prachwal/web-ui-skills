# Web UI Skills Bundle

This repository bundles Codex skills for building professional web applications.

## Included skills

- `preact-ui` — component architecture (MVVM, signals, forms, routing, professional patterns)
- `scss-system` — design token system, mixins, architecture
- `web-accessibility-standards` — accessible HTML, ARIA, WCAG implementation
- `a11y-review` — accessibility audits and QA
- `web-performance` — Core Web Vitals, image optimization, bundle splitting
- `web-i18n` — internationalization, RTL, locale-aware formatting
- `web-testing` — Playwright E2E, component tests, visual regression, CI reporting
- `web-security` — XSS, CSP, session management, headers
- `netlify-serverless` — Netlify Functions & Edge Functions: API patterns, auth, security, caching

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

## Notes

- `web-accessibility-standards` covers implementation work.
- `a11y-review` covers audits and QA.
- `preact-ui` and `scss-system` cover component and styling architecture.
- `web-performance`, `web-i18n`, `web-testing`, and `web-security` cover production concerns.
- `netlify-serverless` covers backend API development on Netlify's serverless infrastructure.
