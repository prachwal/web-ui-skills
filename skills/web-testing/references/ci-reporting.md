# CI reporting and test artifacts

## GitHub Actions — Playwright

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

Always upload the Playwright HTML report on failure — it contains screenshots, traces, and step logs.

## Playwright HTML report

```bash
npx playwright show-report          # open locally
# Report at playwright-report/index.html contains:
# - pass/fail/retry counts
# - per-test trace viewer
# - failure screenshots
# - video recordings (if configured)
```

Enable traces for CI reruns:

```ts
// playwright.config.ts
use: {
  trace: 'on-first-retry',    // capture trace only on retry
  video: 'retain-on-failure', // video only on failure
  screenshot: 'only-on-failure',
}
```

## Vitest reporting (unit/component tests)

```ts
// vite.config.ts
test: {
  reporters: ['verbose', 'junit'],
  outputFile: { junit: 'test-results/junit.xml' },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    reportsDirectory: 'coverage',
  },
}
```

```yaml
# GitHub Actions — publish JUnit results
- uses: mikepenz/action-junit-report@v4
  if: always()
  with:
    report_paths: 'test-results/junit.xml'
```

## Flaky test handling

- Set `retries: 2` in CI only — retries hide real failures if set too high.
- Tag known flaky tests: `test.fixme('…')` or `test.skip(isFlakyEnv, '…')`.
- Track flakiness: log `--reporter=json` output to a dashboard to spot repeat offenders.
- Fix flaky tests: usually caused by missing `await`, race conditions in `waitFor`, or non-deterministic data.

## Parallel sharding for large suites

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]

steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

Merge reports:

```bash
npx playwright merge-reports ./all-blob-reports --reporter html
```

## Test status badges

```markdown
![E2E](https://github.com/org/repo/actions/workflows/e2e.yml/badge.svg)
![Unit](https://github.com/org/repo/actions/workflows/unit.yml/badge.svg)
```

## Checklist

- [ ] HTML report uploaded as artifact on failure
- [ ] Traces enabled on retry; screenshots on failure
- [ ] JUnit XML published to CI so test results appear inline in PRs
- [ ] Coverage report generated and accessible
- [ ] Retries set to 2 in CI; 0 locally
- [ ] Flaky tests tagged and tracked, not silently re-run
