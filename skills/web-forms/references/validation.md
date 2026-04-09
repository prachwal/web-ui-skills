# Form Validation Patterns

Patterns for client-side validation, server-side validation, and keeping both in sync.

## Zod schema as single source of truth

Define one schema and share it between frontend and backend:

```ts
// src/models/contact-form.ts
import { z } from "zod";

export const ContactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address"),
  subject: z.enum(["question", "support", "billing"], {
    errorMap: () => ({ message: "Select a subject" }),
  }),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;
```

## Client-side validation on submit only

Run validation when the user submits, not while they type, to avoid premature errors:

```ts
import { ContactFormSchema, type ContactFormData } from "../models/contact-form";

function validateForm(data: unknown): { ok: true; data: ContactFormData } | { ok: false; fieldErrors: Record<string, string[]> } {
  const result = ContactFormSchema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as string;
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return { ok: false, fieldErrors };
}

async function handleSubmit(event: Event) {
  event.preventDefault();
  const raw = Object.fromEntries(new FormData(event.target as HTMLFormElement));
  const validation = validateForm(raw);

  if (!validation.ok) {
    setFieldErrors(validation.fieldErrors);
    focusFirstError(event.target as HTMLFormElement);
    return;
  }

  // Proceed with validated, typed data
  await submitToApi(validation.data);
}
```

## Server-side validation (Netlify Functions)

Use the same schema in the API handler to validate untrusted input:

```ts
// netlify/functions/contact.ts
import { ContactFormSchema } from "../../src/models/contact-form";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const parsed = ContactFormSchema.safeParse(await req.json());
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fields[key]) fields[key] = [];
      fields[key].push(issue.message);
    }
    return Response.json({ error: "Validation failed", fields }, { status: 422 });
  }

  await sendContactEmail(parsed.data);
  return Response.json({ ok: true }, { status: 200 });
};
```

## Validate on blur for long forms

On forms with many fields, validate a single field when the user leaves it (blur), but only after submit has been attempted once:

```ts
const submitted = signal(false);
const fieldErrors = signal<Record<string, string[]>>({});

function validateField(name: string, value: unknown) {
  if (!submitted.value) return; // Don't nag before first submit
  const result = ContactFormSchema.shape[name as keyof typeof ContactFormSchema.shape]?.safeParse(value);
  if (result && !result.success) {
    fieldErrors.value = { ...fieldErrors.value, [name]: result.error.issues.map((i) => i.message) };
  } else {
    const { [name]: _, ...rest } = fieldErrors.value;
    fieldErrors.value = rest;
  }
}
```

## Async validation (email uniqueness)

For constraints requiring server knowledge (unique email, coupon validity):

```ts
async function validateEmailUnique(email: string): Promise<string | null> {
  // Debounce to avoid a request per keystroke
  const res = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
  const { available } = await res.json();
  return available ? null : "This email is already in use";
}
```

Run async validation in isolation (not inside the Zod parse pass), and show results with `aria-live`:

```tsx
<input
  id="email"
  type="email"
  onBlur={(e) => validateEmailUnique(e.currentTarget.value).then(setEmailError)}
  aria-describedby="email-async-error"
/>
<p id="email-async-error" aria-live="polite" class="field__error">
  {emailError}
</p>
```

## Display rules

- Show one error message per field — the most actionable one.
- Never say "invalid value". Explain what is wrong and how to fix it.
- Remove the error when the field becomes valid; do not wait for re-submit.
- Screen readers re-announce `role="alert"` when content changes; keep messages short and specific.

## Anti-patterns

| Anti-pattern | Why it fails |
|---|---|
| Validating on every keystroke | Marks valid-in-progress input as invalid |
| Generic "This field is required" only | Doesn't tell the user what format is needed |
| Clearing all errors on any input change | Hides errors the user hasn't fixed yet |
| Hiding errors in tooltips only | Screen readers may not discover them |
| Running client validation only | Server receives arbitrary input |
