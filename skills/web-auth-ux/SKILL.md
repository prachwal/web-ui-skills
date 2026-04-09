---
name: web-auth-ux
description: Use when building or reviewing login, registration, password reset, MFA, session expiry, and role/permission UI flows. Covers accessible forms, secure token handling, session state management, and graceful auth error recovery.
---

# Web Auth UX Skill

Use this skill when a page or flow involves authentication, authorization, session management, or identity-related UI.

## Core goals

- Make auth flows accessible, recoverable, and robust under error and expiry conditions.
- Never expose sensitive state in the UI or client-side storage beyond what is necessary.
- Handle session expiry and token refresh transparently where possible.
- Keep role/permission checks in the server layer; mirror them in the UI for experience only.

## Checklist

- [ ] Login form has correct `autocomplete` values (`username`, `current-password`).
- [ ] Registration form uses `new-password` for password fields to trigger password manager.
- [ ] Password fields have a visible show/hide toggle.
- [ ] Auth errors are user-friendly and do not reveal whether an account exists.
- [ ] MFA step is a distinct step, not a buried field.
- [ ] Session expiry is handled gracefully: prompt to re-login, preserve form data where safe.
- [ ] After login, redirect returns the user to the page they originally requested.
- [ ] After logout, all auth tokens and sensitive state are cleared.
- [ ] Role/permission-gated UI is hidden or disabled, not just visually obscured.
- [ ] Password reset flow uses short-lived, single-use tokens.
- [ ] Auth pages are excluded from client-side cache and search indexing.

## Login form pattern

```html
<form method="post" action="/api/auth/login" autocomplete="on">
  <div class="field">
    <label for="email">Email</label>
    <input
      id="email"
      type="email"
      name="email"
      autocomplete="username"
      required
      aria-describedby="login-error"
    />
  </div>
  <div class="field">
    <label for="password">Password</label>
    <input
      id="password"
      type="password"
      name="password"
      autocomplete="current-password"
      required
    />
    <button type="button" aria-label="Show password" aria-pressed="false">Show</button>
  </div>
  <p id="login-error" role="alert" hidden></p>
  <button type="submit">Sign in</button>
  <a href="/auth/reset-password">Forgot password?</a>
</form>
```

## Show/hide password toggle

```ts
function togglePasswordVisibility(inputId: string, btn: HTMLButtonElement) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  btn.setAttribute("aria-pressed", String(isHidden));
  btn.textContent = isHidden ? "Hide" : "Show";
}
```

## Session expiry handling

```ts
// Intercept 401 responses globally and redirect to login
async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth/login?returnTo=${returnTo}`;
    return res; // unreachable but satisfies return type
  }
  return res;
}
```

## Role/permission guard (UI layer)

```ts
// Mirror server-side roles in UI — for experience only, not security
type Role = "admin" | "editor" | "viewer";

function canEdit(role: Role): boolean {
  return role === "admin" || role === "editor";
}

// In component:
{canEdit(user.role) && <button>Edit</button>}
```

Server routes must enforce permissions independently. UI guards reduce noise, not attack surface.

## MFA step state machine

```ts
type AuthState =
  | { step: "credentials" }
  | { step: "mfa"; method: "totp" | "sms" }
  | { step: "complete"; user: User }
  | { step: "error"; message: string };
```

## Secure token handling rules

- Store session tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies — not `localStorage`.
- Never log tokens, passwords, or full auth headers.
- Clear tokens on logout by making the server invalidate the session and clearing the cookie.
- Use short-lived access tokens with refresh token rotation where the pattern fits.

## Password reset pattern

1. Accept email, show generic success message regardless of whether the account exists.
2. Send a short-lived (15–60 min), single-use token via email.
3. On the reset form, use `autocomplete="new-password"` for both fields.
4. Invalidate the token immediately on use.
5. Notify the user by email that the password was changed.

## Testing focus

- Keyboard-only login, MFA, and password reset flows.
- Auth error messages for wrong credentials, locked accounts, and expired tokens.
- Session expiry mid-flow (submitting a form after the session dies).
- Redirect after login returns to the pre-login URL.
- Role-gated elements are absent from the DOM, not just visually hidden.
- Password manager compatibility.

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [MDN: autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
- [WCAG 2.2: 1.3.5 Identify Input Purpose](https://www.w3.org/TR/WCAG22/#identify-input-purpose)
