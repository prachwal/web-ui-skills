# CI Testing with Storybook

CI configuration, vitest addon setup, accessibility test enforcement, and visual regression with Chromatic.

## Vitest addon setup

```bash
npx storybook add @storybook/addon-vitest
```

The addon runs story `play` functions and component tests in Vitest's browser mode (via Playwright) so tests execute in a real DOM environment.

```ts
// vitest.config.ts — Storybook Vitest integration
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

export default defineConfig({
  plugins: [
    storybookTest(),
  ],
  test: {
    browser: {
      provider: "playwright",
      enabled: true,
      name: "chromium",
      headless: true,
    },
  },
});
```

Run story tests:

```bash
npx vitest --project=storybook
```

## Accessibility enforcement per story

```ts
// Fail CI for a specific story with accessibility violations
export const WithColorContrast: Story = {
  args: { variant: "primary" },
  parameters: {
    a11y: {
      test: "error", // override to "warn" for known issues while fixing
    },
  },
};

// Opt a story out of a11y checks when the violation is in a third-party embed
export const WithEmbed: Story = {
  parameters: {
    a11y: { disable: true },
  },
};
```

## GitHub Actions CI workflow

```yaml
# .github/workflows/storybook.yml
name: Storybook CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run Storybook component tests
        run: npx vitest --project=storybook --reporter=verbose

      - name: Build Storybook (for Chromatic)
        run: npm run build-storybook

      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          storybookBuildDir: storybook-static
          exitZeroOnChanges: false   # fail CI if visual changes are detected
```

## Chromatic visual regression baseline

On the first run, Chromatic captures a baseline screenshot for each story. Subsequent runs compare to the baseline:

- **Accepted** → new baseline.
- **Unreviewed** change → CI fails (or raises a check) until someone approves or rejects in the Chromatic UI.
- Mark known acceptable changes as accepted to update the baseline.

To skip Chromatic for a story (e.g., dynamic content):

```ts
export const AnimatingBanner: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};
```

## Tagging experimental stories

```ts
// Prevent experimental stories from blocking the whole suite
export const ExperimentalLayout: Story = {
  tags: ["experimental"],  // exclude from CI run; document in meta
};
```

```ts
// In vitest.config.ts — skip stories tagged "experimental"
storybookTest({
  tags: { exclude: ["experimental"] },
})
```

## Rules

- Run `vitest --project=storybook` in CI on every PR — failing stories are product regressions.
- Use browser-mode (`playwright`) for DOM-accurate tests, not jsdom-only.
- Build Storybook in CI and publish to Chromatic (or similar) for visual regression coverage.
- Set `a11y.test: "error"` globally in `preview.ts`; use `disable: true` only as a temporary exception.
- Tag experimental stories with `["experimental"]` and exclude them from CI runs.
- Never set `exitZeroOnChanges: false` if visual changes are expected — review and accept them first.
