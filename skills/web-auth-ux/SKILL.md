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

## Reference files

### [`references/login-form.md`](references/login-form.md)
**Login and registration forms** — Complete accessible HTML for login with `autocomplete="username"` + `current-password`, registration with `new-password`, show/hide password toggle with `aria-pressed`, auth error message wording table that avoids revealing account existence, autocomplete value reference.

### [`references/session-management.md`](references/session-management.md)
**Session expiry and role guards** — `apiFetch()` interceptor that redirects to `/auth/login?returnTo=…` on 401 with open-redirect protection, post-login `redirectAfterLogin()` with same-origin validation, `permissions` map with role helpers, route-level redirect guard, token storage comparison table (cookies vs sessionStorage vs localStorage vs in-memory), secure logout with `finally` block.

### [`references/mfa-reset.md`](references/mfa-reset.md)
**MFA and password reset** — `AuthStep` discriminated union state machine, `submitCredentials()` handler transitioning through MFA step, TOTP/SMS code input with `autocomplete="one-time-code"`, password reset two-step flow (request → token → confirm), server-side generic response pattern, single-use token rules, `safeReturnTo()` open-redirect guard.

## Testing focus

- Keyboard-only login, MFA, and password reset flows.
- Auth error messages for wrong credentials, locked accounts, and expired tokens.
- Session expiry mid-flow (submitting a form after the session dies).
- Redirect after login returns to the pre-login URL.
- Role-gated elements are absent from the DOM, not just visually hidden.
- Password manager compatibility.

## External references

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [MDN: autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
- [WCAG 2.2: 1.3.5 Identify Input Purpose](https://www.w3.org/TR/WCAG22/#identify-input-purpose)
