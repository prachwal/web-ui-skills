# Visual regression testing

## When to use

- Stable, mature UI surfaces (design system components, landing pages).
- When a change must not alter the visual appearance (refactoring, library upgrades).
- After intentional visual changes — re-record baselines and commit.

Do **not** use visual tests as a substitute for behavior tests.

## Playwright screenshot comparisons

```ts
import { test, expect } from '@playwright/test';

test('hero section matches baseline', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('banner')).toHaveScreenshot('hero.png', {
    maxDiffPixelRatio: 0.01,  // allow 1% pixel difference
  });
});
```

Baselines are stored in `e2e/__snapshots__/`. Commit them with your code.

## Update baselines

```bash
npx playwright test --update-snapshots
```

Review the visual diff in the HTML report before committing updated snapshots.

## Environment consistency

Visual snapshots are pixel-exact — differences in OS font rendering, GPU, or screen DPI will cause failures. Enforce a consistent environment:

```yaml
# Run visual tests only on a pinned Docker image in CI
# playwright.config.ts
projects:
  - name: visual
    use:
      ...devices['Desktop Chrome']
      # Force deterministic viewport
      viewport: { width: 1280, height: 720 }
```

Use a single CI runner image for visual tests; do not run on developer machines.

## Isolate dynamic content

Before taking a screenshot, mask or stub content that changes on every render:

```ts
// Mask timestamps and dynamic text
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [page.locator('[data-testid="last-updated"]'), page.locator('.avatar')],
});
```

Or stub dates in the component:

```ts
await page.clock.setFixedTime(new Date('2024-01-15T12:00:00Z'));
```

## Storybook + Chromatic (design system)

For component-level visual regression:
- Publish Storybook stories to Chromatic in CI.
- Chromatic captures screenshots per story and diffs against the accepted baseline.
- Designers review and accept visual changes before merge.

```yaml
# .github/workflows/chromatic.yml
- run: npx chromatic --project-token=${{ secrets.CHROMATIC_TOKEN }}
```

## Checklist

- [ ] Baselines committed and reviewed before merge
- [ ] Dynamic content masked or date-stubbed
- [ ] Tests run on a fixed CI environment (pinned runner image)
- [ ] `maxDiffPixelRatio` set to a non-zero tolerance to avoid flakiness from sub-pixel differences
- [ ] Baselines re-recorded and reviewed after intentional design changes
