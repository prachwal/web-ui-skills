# Storybook Setup

Installation, Vite integration, addon configuration, and initial project structure.

## Installation

```bash
# Initialise Storybook in an existing project
npm create storybook@latest

# Or for a Preact + Vite project where auto-detection may be uncertain:
npx storybook@latest init --type preact
```

The CLI installs the framework package, generates `.storybook/main.ts`, and adds `storybook` and `build-storybook` scripts to `package.json`.

## `.storybook/main.ts` — Vite + essential addons

```ts
import type { StorybookConfig } from "@storybook/preact-vite"; // or @storybook/react-vite, etc.

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],

  addons: [
    "@storybook/addon-essentials",      // controls, actions, docs, viewport, backgrounds
    "@storybook/addon-a11y",            // accessibility checks in the Storybook panel
    "@storybook/addon-vitest",          // component tests in the Storybook UI
  ],

  framework: {
    name: "@storybook/preact-vite",
    options: {},
  },

  docs: {
    autodocs: "tag", // generate docs page for stories tagged with autodocs
  },

  viteFinalConfig(config) {
    // Extend Vite config if needed (e.g., add aliases)
    return config;
  },
};

export default config;
```

## `.storybook/preview.ts` — global decorators and parameters

```ts
import type { Preview } from "@storybook/preact";
import "../src/styles/global.scss"; // import global styles so stories see the same CSS

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
    layout: "centered",  // default layout for all stories
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#1e293b" },
      ],
    },
    a11y: {
      // Fail CI for all stories with accessibility violations
      test: "error",
    },
  },
};

export default preview;
```

## npm scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## File layout convention

```
src/
  components/
    Button/
      Button.tsx
      Button.stories.tsx    ← stories next to the component
      Button.test.ts        ← vitest unit tests (optional; stories can replace them)
      Button.module.scss
  pages/
    LoginPage/
      LoginPage.tsx
      LoginPage.stories.tsx
.storybook/
  main.ts
  preview.ts
```

## Rules

- Use `npm create storybook@latest` rather than manual wiring to get the correct framework package.
- Import global styles in `.storybook/preview.ts` so stories render identically to the real app.
- Set `a11y.test: "error"` globally so every story fails CI on accessibility violations by default.
- Keep stories next to the component they document — not in a separate `stories/` directory.
- Use the `@storybook/preact-vite` framework (or the framework matching the app) rather than the generic Webpack integration.

## Definition of Done (Storybook Docs)

Use this checklist before closing any Storybook docs task:

- Copy docs-related requirements from the prompt 1:1 into a local checklist before implementing.
- Map each requirement to a concrete artifact (`requirement -> artifact`) and verify all mappings in code.
- For **Autodocs** requirements, confirm both:
  - `docs.autodocs: "tag"` (or project-equivalent setting) is active in Storybook config.
  - Stories that should generate docs include `tags: ["autodocs"]`.
- For **MDX** requirements, confirm both:
  - At least one `*.mdx` docs file exists for the requested scope.
  - `stories` glob in `.storybook/main.ts` still includes MDX patterns (for example `../src/**/*.mdx`).
- Do not remove scaffolded docs artifacts unless replacement artifacts are added in the same change.
- Run a final self-audit table before finishing: `Requirement | Done | Where`.

## Common Failure Modes (and quick detection)

- **MDX silently disabled** by removing MDX globs from `stories`.
  - Detect with: inspect `.storybook/main.ts` and confirm MDX pattern is present.
- **Autodocs not generated** because stories are missing `autodocs` tags.
  - Detect with: grep for `tags: ["autodocs"]` in target stories and open Docs tab for one story.
- **Feature loss after cleanup** when template docs are deleted without replacement.
  - Detect with: compare requirement checklist vs. current artifacts before merge.
