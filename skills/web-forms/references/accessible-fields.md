# Accessible Field Patterns

HTML patterns for accessible, browser-compatible form fields with correct ARIA and autocomplete.

## Basic field anatomy

```html
<div class="field">
  <label for="email">Email address</label>
  <input
    id="email"
    type="email"
    name="email"
    autocomplete="email"
    required
    aria-required="true"
    aria-describedby="email-hint email-error"
  />
  <p id="email-hint" class="field__hint">We'll only use this for account recovery.</p>
  <p id="email-error" class="field__error" role="alert" hidden></p>
</div>
```

Rules:
- `for` and `id` must match exactly.
- `aria-describedby` can list multiple IDs; order them hint-first, error-last.
- `role="alert"` on the error paragraph triggers announcement on content change.
- Show the error paragraph only when there is content to show; use `hidden` otherwise.

## Autocomplete values for common fields

| Field | `autocomplete` value |
|---|---|
| Login email or username | `username` |
| Login password | `current-password` |
| Registration / new password | `new-password` |
| Confirm new password | `new-password` |
| First name | `given-name` |
| Last name | `family-name` |
| Full name | `name` |
| Phone | `tel` |
| Street address | `address-line1` |
| City | `address-level2` |
| Postal code | `postal-code` |
| Country | `country-name` |
| Credit card number | `cc-number` |
| Credit card expiry | `cc-exp` |

## Required field indication

```html
<!-- Visible asterisk with screen-reader-only explanation at top of form -->
<p class="sr-only" id="required-note">Fields marked with * are required.</p>

<label for="name">
  Full name <span aria-hidden="true">*</span>
</label>
<input
  id="name"
  type="text"
  name="name"
  autocomplete="name"
  required
  aria-required="true"
  aria-describedby="required-note name-error"
/>
<p id="name-error" role="alert" class="field__error" hidden></p>
```

## Select and textarea

```html
<!-- Select -->
<div class="field">
  <label for="country">Country</label>
  <select id="country" name="country" autocomplete="country-name" required>
    <option value="">Choose a country</option>
    <option value="pl">Poland</option>
    <option value="de">Germany</option>
  </select>
</div>

<!-- Textarea -->
<div class="field">
  <label for="bio">Bio</label>
  <textarea
    id="bio"
    name="bio"
    rows="4"
    maxlength="500"
    aria-describedby="bio-count"
  ></textarea>
  <p id="bio-count" class="field__hint" aria-live="polite">0 / 500 characters</p>
</div>
```

## Checkbox and radio groups

```html
<!-- Single checkbox with explicit label -->
<div class="field field--checkbox">
  <input type="checkbox" id="terms" name="terms" required />
  <label for="terms">I agree to the <a href="/terms">Terms of Service</a></label>
</div>

<!-- Radio group — use fieldset + legend -->
<fieldset>
  <legend>Preferred contact method</legend>
  <div class="field field--radio">
    <input type="radio" id="contact-email" name="contact" value="email" />
    <label for="contact-email">Email</label>
  </div>
  <div class="field field--radio">
    <input type="radio" id="contact-phone" name="contact" value="phone" />
    <label for="contact-phone">Phone</label>
  </div>
</fieldset>
```

## Show/hide password

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

HTML:

```html
<div class="field field--password">
  <label for="password">Password</label>
  <div class="field__input-row">
    <input id="password" type="password" name="password" autocomplete="current-password" required />
    <button type="button" aria-label="Show password" aria-pressed="false" onclick="togglePasswordVisibility('password', this)">Show</button>
  </div>
</div>
```

## Mobile input types

```html
<!-- Numeric OTP -->
<input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" />

<!-- Phone -->
<input type="tel" inputmode="tel" autocomplete="tel" />

<!-- Search (dismisses mobile keyboard on submit) -->
<input type="search" inputmode="search" />
```

Use `inputmode` to control the mobile keyboard without changing semantic type.
