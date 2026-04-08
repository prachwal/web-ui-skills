# Testing

## Setup

```sh
npm install --save-dev @testing-library/preact @testing-library/user-event vitest jsdom
```

Configure Vitest in `vite.config.ts`:

```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test-setup.ts',
}
```

## Guiding principles

- Test user-visible behavior, not implementation details.
- Query by role, label, or visible text — not by `data-testid` unless unavoidable.
- Mock only the service layer (API calls); let Models, ViewModels, and Views run real code.
- Cover the four states of every async component: loading, error, empty, and success.

## Component test structure

```tsx
import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginView } from './LoginView';
import * as authService from '../../services/authService';

describe('LoginView', () => {
  it('shows validation error when email is invalid', async () => {
    render(<LoginView />);
    await userEvent.type(screen.getByLabelText('Email'), 'notanemail');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');
  });

  it('submits credentials and shows success', async () => {
    vi.spyOn(authService, 'loginService').mockResolvedValue({ token: 'abc' });
    render(<LoginView />);
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText(/welcome/i)).toBeInTheDocument());
  });

  it('shows server error on failed login', async () => {
    vi.spyOn(authService, 'loginService').mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginView />);
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials'));
  });
});
```

## Model unit tests (no render needed)

```ts
import { describe, it, expect } from 'vitest';
import { validateLogin } from './loginModel';

describe('validateLogin', () => {
  it('returns email error for missing @', () => {
    const errors = validateLogin({ email: 'notvalid', password: 'secret123' });
    expect(errors.email).toBeDefined();
  });

  it('returns no errors for valid fields', () => {
    const errors = validateLogin({ email: 'a@b.com', password: 'secret123' });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
```

## ViewModel hook tests

```ts
import { renderHook, act } from '@testing-library/preact';
import { vi } from 'vitest';
import { useProductListViewModel } from './useProductViewModel';
import * as productService from '../services/productService';

it('loads products and sets items signal', async () => {
  const mockData = [{ id: '1', name: 'Widget', price: 9.99 }];
  vi.spyOn(productService, 'fetchProducts').mockResolvedValue(mockData);

  const { result } = renderHook(() => useProductListViewModel());

  act(() => { result.current.load(); });

  await waitFor(() => expect(result.current.loading.value).toBe(false));
  expect(result.current.items.value).toEqual(mockData);
});
```

## Async state coverage

For every component with async data, write tests for:

- Loading state — spinner or skeleton is visible.
- Success state — data renders correctly.
- Empty state — empty message renders, not a blank screen.
- Error state — error message is visible and accessible (`role="alert"`).

## Accessibility tests

```ts
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<LoginView />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Rules

- Do not test signal internals — test the rendered output.
- Do not snapshot entire components — snapshots break on every style change.
- Mock `fetch` or service functions, not `signal` or `useState`.
- Test keyboard interactions with `userEvent.keyboard('{Tab}{Enter}')`.
- Always `await` async interactions before asserting.
