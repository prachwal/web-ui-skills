# Forms

## Model layer — validation

Define validation rules in the Model, independent of UI:

```ts
// models/loginModel.ts
export interface LoginFields { email: string; password: string; }
export type LoginErrors = Partial<Record<keyof LoginFields, string>>;

export function validateLogin(fields: LoginFields): LoginErrors {
  const errors: LoginErrors = {};
  if (!fields.email.includes('@')) errors.email = 'Enter a valid email address.';
  if (fields.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  return errors;
}
```

## ViewModel layer — form state

```ts
// viewmodels/useLoginViewModel.ts
import { useSignal, useComputed } from '@preact/signals';
import { validateLogin, LoginFields } from '../models/loginModel';
import { loginService } from '../services/authService';

export function useLoginViewModel() {
  const fields = useSignal<LoginFields>({ email: '', password: '' });
  const errors = useComputed(() => validateLogin(fields.value));
  const isValid = useComputed(() => Object.keys(errors.value).length === 0);
  const pending = useSignal(false);
  const serverError = useSignal<string | null>(null);

  const setField = (name: keyof LoginFields, value: string) => {
    fields.value = { ...fields.value, [name]: value };
  };

  const submit = async () => {
    if (!isValid.value) return;
    pending.value = true;
    serverError.value = null;
    try {
      await loginService(fields.value);
    } catch (e) {
      serverError.value = (e as Error).message;
    } finally {
      pending.value = false;
    }
  };

  return { fields, errors, isValid, pending, serverError, setField, submit };
}
```

## View layer — rendering only

```tsx
// features/login/LoginView.tsx
export function LoginView() {
  const vm = useLoginViewModel();
  return (
    <form onSubmit={(e) => { e.preventDefault(); vm.submit(); }}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={vm.fields.value.email}
        onInput={(e) => vm.setField('email', e.currentTarget.value)}
        aria-describedby={vm.errors.value.email ? 'email-error' : undefined}
      />
      {vm.errors.value.email && (
        <span id="email-error" role="alert">{vm.errors.value.email}</span>
      )}

      <button type="submit" disabled={vm.pending.value}>
        {vm.pending.value ? 'Signing in…' : 'Sign in'}
      </button>

      {vm.serverError.value && <p role="alert">{vm.serverError.value}</p>}
    </form>
  );
}
```

## Form rules

- Label every field with `<label>` or `aria-label`.
- Show validation messages inline, linked via `aria-describedby`.
- Use `role="alert"` for error messages that appear after user action.
- Disable submit only while a request is in flight — not while the form is invalid (prefer showing errors instead).
- Preserve keyboard focus on the first invalid field after a failed submit.
- Use controlled inputs (signal-bound) when you need live validation or computed state.
- Use uncontrolled inputs (`useRef` + `FormData`) for simple, no-validation forms.
- Expose pending, success, and error states distinctly — never a single "status" string.

