# Submit State Machine

Patterns for managing async form submission states: idle, pending, success, and error.

## State type

```ts
export type SubmitState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };
```

## Preact signal-based submit handler

```ts
import { signal } from "@preact/signals";

const submitState = signal<SubmitState>({ status: "idle" });

async function handleSubmit(event: Event) {
  event.preventDefault();

  // Prevent duplicate submissions
  if (submitState.value.status === "pending") return;

  submitState.value = { status: "pending" };

  const form = event.target as HTMLFormElement;
  const data = Object.fromEntries(new FormData(form));

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.status === 422) {
      const body = await res.json();
      submitState.value = {
        status: "error",
        message: "Please fix the errors below.",
        fieldErrors: body.fields ?? {},
      };
      focusFirstError(form);
      return;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    submitState.value = { status: "success", message: "Your message has been sent." };
    form.reset();
  } catch {
    submitState.value = { status: "error", message: "Something went wrong. Please try again." };
  }
}
```

## Submit button with pending state

```tsx
function SubmitButton({ state }: { state: SubmitState }) {
  const isPending = state.status === "pending";
  return (
    <button
      type="submit"
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending ? "Sending…" : "Send message"}
    </button>
  );
}
```

## Global form status message

Announce success or error to screen readers with `role="status"` or `role="alert"`:

```tsx
function FormStatus({ state }: { state: SubmitState }) {
  if (state.status === "idle" || state.status === "pending") return null;

  const isError = state.status === "error";
  return (
    <p role={isError ? "alert" : "status"} class={isError ? "form-error" : "form-success"}>
      {state.message}
    </p>
  );
}
```

## Field-level error injection from server response

```tsx
function FieldError({ errors, fieldName }: { errors?: Record<string, string[]>; fieldName: string }) {
  const messages = errors?.[fieldName];
  if (!messages?.length) return null;
  return (
    <p id={`${fieldName}-error`} role="alert" class="field__error">
      {messages[0]}
    </p>
  );
}
```

Usage on a field:

```tsx
<input
  id="email"
  type="email"
  name="email"
  aria-describedby="email-error"
  aria-invalid={!!submitState.value.fieldErrors?.["email"]}
/>
<FieldError errors={submitState.value.fieldErrors} fieldName="email" />
```

## Focus management after failed submit

Move focus to the first invalid field or the error summary so keyboard and screen reader users know where to look:

```ts
export function focusFirstError(form: HTMLFormElement) {
  // First try: find a field with aria-invalid
  const firstInvalid = form.querySelector<HTMLElement>("[aria-invalid='true']");
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }
  // Fallback: find the first visible error paragraph
  const firstError = form.querySelector<HTMLElement>("[role='alert']:not([hidden])");
  firstError?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
```

## Multi-step form state

For wizard-style flows, add a step dimension to the state:

```ts
type WizardState =
  | { step: "personal"; submitState: SubmitState }
  | { step: "address"; submitState: SubmitState }
  | { step: "review"; submitState: SubmitState }
  | { step: "complete" };
```

Keep each step's validation independent. Only validate the current step on Next, and validate the whole payload on final submit.

## Rules

- Always prevent default on the `submit` event.
- Guard against duplicate submissions with `status === "pending"` check.
- Reset form with `form.reset()` only on success.
- Preserve entered data on error so the user does not lose their work.
- Move focus programmatically after submit so keyboard users are not stranded.
- Use `aria-busy` on the submit button during pending to communicate state to assistive tech.
