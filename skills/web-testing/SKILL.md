---
name: web-testing
description: Use when designing or refactoring web UI test strategy, including Playwright-based end-to-end tests, regression coverage, stable locators, visual comparisons, browser compatibility, progressive enhancement, and CI reporting.
---

# Web Testing Skill

Use this skill when you need a practical test strategy for a web app, especially for user-visible flows and regression coverage.

## Core principles

1. Test user behavior, not implementation details.
2. Put the right assertion at the right layer: unit, component, E2E, or visual regression.
3. Prefer stable locators based on role, label, text, or test ids only when needed.
4. Keep tests deterministic and isolate external dependencies.
5. Cover the critical paths first, then expand to edge cases.
6. Treat flaky tests as defects in the test design.

## Workflow

1. Identify the critical flows: sign-in, sign-up, checkout, edit/save, search, navigation, error handling.
2. Choose the minimum test layer that proves the behavior.
3. Use browser automation for end-to-end journeys and realistic rendering.
4. Add visual comparisons only for stable UI surfaces with controlled baselines.
5. Collect artifacts and reports so failures are easy to triage.
6. Run the suite in CI across the browsers the app supports.

## Practical rules

- Prefer `getByRole`, `getByLabelText`, and similar user-facing queries.
- Keep assertions tied to visible outcomes.
- Use screenshots only when visual stability matters and the baseline is under control.
- Keep accessibility smoke checks in the E2E layer.
- Mock the network only when the real dependency makes the test too slow or unstable.
- Avoid brittle timing assumptions.

## Browser compatibility testing

Define the supported browser matrix in `playwright.config.ts` and test on it in CI:

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox",  use: { ...devices["Desktop Firefox"] } },
    { name: "webkit",   use: { ...devices["Desktop Safari"] } },

    // Mobile viewports
    { name: "mobile-chrome",  use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari",  use: { ...devices["iPhone 15"] } },
  ],
});
```

Rules:
- Set a documented browser support matrix in `README.md` or a `browserlist` config.
- Run the full E2E suite on all supported browsers in CI, not only Chromium.
- Flag browser-specific failures separately so they are not buried in aggregate results.
- Test at the minimum supported viewport width (typically 320px).
- Verify touch events and pointer precision differences on mobile projects.

## Progressive enhancement testing

Progressive enhancement means the base experience works without JavaScript, CSS features, or APIs that require modern support:

```ts
// Test JavaScript-disabled behavior with Playwright
test("form submits without JS", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/contact");

  // Native form submit should still deliver the POST to the server
  await page.fill("#name", "Test User");
  await page.fill("#email", "test@example.com");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/contact\/success/);
  await context.close();
});
```

Progressive enhancement checklist for tests:
- [ ] Core content is readable without CSS (disable stylesheets in DevTools).
- [ ] Forms submit to server actions when JS is unavailable (for server-rendered apps).
- [ ] Navigation works without JS for server-rendered routes.
- [ ] Images have meaningful `alt` text when the image fails to load.
- [ ] No critical content is rendered exclusively via JS when server rendering is expected.

## Feature detection over user-agent sniffing

Test that the app uses feature detection, not UA detection:

```ts
// Correct in app code — use feature detection
if ("IntersectionObserver" in window) {
  setupLazyImages();
}

// Wrong in app code — brittle UA sniffing
// if (navigator.userAgent.includes("Safari")) { ... }
```

## Cross-browser CSS testing

Use Stylelint with the browserslist plugin to catch unsupported CSS automatically:

```bash
npm install -D stylelint stylelint-no-unsupported-browser-features
```

```json
// .stylelintrc
{
  "plugins": ["stylelint-no-unsupported-browser-features"],
  "rules": {
    "plugin/no-unsupported-browser-features": [true, {
      "severity": "warning",
      "ignore": ["css-transitions", "css-transforms"]
    }]
  }
}
```

Add to CI alongside ESLint and TypeScript checks.

## References

- [references/playwright-basics.md](references/playwright-basics.md)
- [references/visual-regression.md](references/visual-regression.md)
- [references/ci-reporting.md](references/ci-reporting.md)
- [Playwright: Multiple browsers](https://playwright.dev/docs/browsers)
- [browserslist](https://browsersl.ist/)
- [MDN: Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)
