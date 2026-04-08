# Playwright basics

## Setup

```bash
npm init playwright@latest
# Installs Playwright Test, browsers, and example config
```

## Configuration (`playwright.config.ts`)

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['line']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test anatomy

```ts
import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.getByLabel('Email').fill('notanemail');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toContainText('valid email');
  });

  test('redirects to dashboard on success', async ({ page }) => {
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('secret123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Locator priority

Use in this order (most preferred first):

1. `getByRole('button', { name: /submit/i })` — most accessible and stable
2. `getByLabel('Email')` — form fields
3. `getByText('Sign in')` — visible text
4. `getByTestId('submit-btn')` — fallback, only when role/label not available

Avoid: `page.$('.submit-btn')`, `page.locator('div > button:nth-child(2)')`.

## Network mocking

```ts
// Mock API response for isolated UI testing
await page.route('**/api/products', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [{ id: '1', name: 'Widget', price: 9.99 }] }),
  });
});
await page.goto('/products');
await expect(page.getByRole('listitem')).toHaveCount(1);
```

## Authentication state (reuse across tests)

```ts
// Save auth state once per worker
// playwright.config.ts
setup: [{ name: 'setup', testMatch: /.*\.setup\.ts/ }]

// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

## Accessibility checks in E2E

```ts
import { checkA11y } from 'axe-playwright';

test('login page has no a11y violations', async ({ page }) => {
  await page.goto('/login');
  await checkA11y(page);
});
```

## Debugging tips

```bash
npx playwright test --ui          # visual UI test runner
npx playwright test --debug       # step-by-step debugger
npx playwright codegen http://…   # record interactions as test code
npx playwright show-report        # open last HTML report
```
