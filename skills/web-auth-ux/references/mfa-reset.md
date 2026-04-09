# MFA and Password Reset

Patterns for multi-factor authentication UI and secure password reset flows.

## MFA state machine

Model the authentication flow as a discriminated union to make steps explicit:

```ts
export type AuthStep =
  | { step: "credentials" }
  | { step: "mfa"; method: "totp" | "sms"; maskedRecipient?: string }
  | { step: "complete"; user: AuthUser }
  | { step: "error"; message: string; retriable: boolean };
```

In a signal-based Preact component:

```ts
import { signal } from "@preact/signals";

const authStep = signal<AuthStep>({ step: "credentials" });

async function submitCredentials(email: string, password: string) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 200) {
    const body = await res.json();
    if (body.mfaRequired) {
      authStep.value = {
        step: "mfa",
        method: body.mfaMethod,
        maskedRecipient: body.maskedRecipient,
      };
    } else {
      authStep.value = { step: "complete", user: body.user };
    }
    return;
  }

  authStep.value = {
    step: "error",
    message: "Incorrect email or password.",
    retriable: true,
  };
}
```

## TOTP/SMS code input

```html
<form id="mfa-form" autocomplete="off">
  <p id="mfa-desc">Enter the 6-digit code from your authenticator app.</p>

  <div class="field">
    <label for="mfa-code">Authentication code</label>
    <input
      id="mfa-code"
      type="text"
      name="code"
      inputmode="numeric"
      pattern="[0-9]{6}"
      maxlength="6"
      autocomplete="one-time-code"
      aria-describedby="mfa-desc mfa-error"
      required
    />
    <p id="mfa-error" role="alert" class="field__error" hidden></p>
  </div>

  <button type="submit">Verify</button>
  <button type="button" id="resend-btn">Send a new code</button>
</form>
```

Use `autocomplete="one-time-code"` for SMS-delivered codes — iOS and Android can autofill from SMS.

## Password reset flow (step-by-step)

### Step 1: Request form

```html
<form method="post" action="/api/auth/reset-password/request">
  <div class="field">
    <label for="reset-email">Email address</label>
    <input
      id="reset-email"
      type="email"
      name="email"
      autocomplete="username"
      required
    />
  </div>
  <button type="submit">Send reset link</button>
</form>
```

API must return the same success message regardless of whether the account exists:

```ts
// netlify/functions/reset-password-request.ts
export default async (req: Request) => {
  const { email } = await req.json();
  // Fire-and-forget — do not reveal whether the email exists
  void sendResetEmailIfExists(email);
  return Response.json({ ok: true }); // Always 200
};
```

### Step 2: Reset form (token from email link)

```html
<form method="post" action="/api/auth/reset-password/confirm">
  <input type="hidden" name="token" value="{{TOKEN_FROM_URL}}" />

  <div class="field">
    <label for="new-password">New password</label>
    <input
      id="new-password"
      type="password"
      name="password"
      autocomplete="new-password"
      minlength="12"
      required
    />
  </div>

  <div class="field">
    <label for="confirm-password">Confirm new password</label>
    <input
      id="confirm-password"
      type="password"
      name="passwordConfirm"
      autocomplete="new-password"
      required
    />
  </div>

  <button type="submit">Set new password</button>
</form>
```

### Reset token rules

- Token must be single-use: mark as consumed immediately on first use.
- Expiry: 15–60 minutes maximum.
- Token must be cryptographically random (≥ 128 bits entropy).
- After successful reset, invalidate all existing sessions for the account.
- Send a notification email confirming the password was changed.

## Post-login redirect security

```ts
function safeReturnTo(raw: string | null): string {
  if (!raw) return "/dashboard";
  // Only allow paths on the same origin
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  // Block protocol-relative or data URIs
  if (/^[a-z]+:/i.test(raw)) return "/dashboard";
  return raw;
}
```

Pass through `returnTo` in all auth step redirects (credentials → MFA → complete) so the final destination survives multi-step flows.
