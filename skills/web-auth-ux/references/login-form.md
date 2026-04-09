# Login Form Patterns

Accessible HTML for login and registration forms with correct autocomplete and ARIA attributes.

## Login form

```html
<form method="post" action="/api/auth/login" autocomplete="on" novalidate>
  <div class="field">
    <label for="email">Email address</label>
    <input
      id="email"
      type="email"
      name="email"
      autocomplete="username"
      required
      aria-required="true"
      aria-describedby="login-error"
      inputmode="email"
    />
  </div>

  <div class="field field--password">
    <label for="password">Password</label>
    <div class="field__input-row">
      <input
        id="password"
        type="password"
        name="password"
        autocomplete="current-password"
        required
        aria-required="true"
      />
      <button
        type="button"
        aria-label="Show password"
        aria-pressed="false"
        class="btn-icon"
        onclick="togglePasswordVisibility('password', this)"
      >
        Show
      </button>
    </div>
  </div>

  <p id="login-error" role="alert" class="form-error" hidden></p>

  <button type="submit">Sign in</button>

  <div class="form-links">
    <a href="/auth/reset-password">Forgot password?</a>
    <a href="/auth/register">Create an account</a>
  </div>
</form>
```

## Registration form differences

```html
<!-- On registration: use new-password, not current-password -->
<input
  id="password"
  type="password"
  name="password"
  autocomplete="new-password"
  aria-describedby="password-hint password-error"
  required
/>
<p id="password-hint" class="field__hint">
  At least 12 characters, including a number and a symbol.
</p>

<!-- Confirm password field -->
<input
  id="password-confirm"
  type="password"
  name="passwordConfirm"
  autocomplete="new-password"
  aria-describedby="password-confirm-error"
  required
/>
```

Use `autocomplete="new-password"` on both fields in registration so browsers offer to generate a strong password. Do not use `autocomplete="off"` — it blocks password managers.

## Show/hide password toggle

```ts
function togglePasswordVisibility(inputId: string, btn: HTMLButtonElement) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  btn.setAttribute("aria-pressed", String(isHidden));
  btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  btn.textContent = isHidden ? "Hide" : "Show";
}
```

## Auth error message rules

| Scenario | Safe message |
|---|---|
| Wrong email or password | "Incorrect email or password." — never reveal which |
| Account does not exist | Same message as wrong password |
| Account locked | "Your account has been locked. Check your email for instructions." |
| Too many attempts | "Too many failed attempts. Try again in 10 minutes." |
| Expired session | "Your session has expired. Please sign in again." |
| MFA code wrong | "Incorrect code. Try again or request a new one." |

Never include the attempted email or username in the error message.

## Autocomplete reference

| Field purpose | `autocomplete` value |
|---|---|
| Login email / username | `username` |
| Login password | `current-password` |
| New password (registration, reset) | `new-password` |
| OTP / MFA code | `one-time-code` |
| Given name | `given-name` |
| Family name | `family-name` |
