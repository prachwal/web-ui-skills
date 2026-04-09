---
name: web-forms
description: Use when building or reviewing web forms, including accessible labels, validation, error messaging, pending and success states, async submit flows, spam resistance, and form tests.
---

# Web Forms Skill

Use this skill when a page collects user input through forms, filters, account flows, checkout steps, or multi-step wizards.

## Core goals

- Make forms accessible, predictable, and recoverable.
- Validate input at the right boundary without hiding helpful client-side feedback.
- Preserve user input through errors, retries, and navigation where appropriate.
- Make async submit states explicit and testable.

## Checklist

- [ ] Every field has a visible label or an accessible name.
- [ ] Required fields are indicated visually and programmatically.
- [ ] Error messages identify the field and explain how to fix the problem.
- [ ] Field errors are linked with `aria-describedby`.
- [ ] Summary errors link to fields on long forms or multi-step flows.
- [ ] Validation runs at submit time and avoids noisy validation while the user is still typing.
- [ ] Submit buttons show pending state and prevent duplicate submissions.
- [ ] Successful submission has a clear confirmation or next step.
- [ ] Failed submission preserves entered data unless there is a security reason not to.
- [ ] Password managers and browser autocomplete are supported with appropriate `autocomplete` values.
- [ ] Spam protection does not block assistive technology or keyboard-only users.
- [ ] Tests cover happy path, validation failures, server failures, and retry behavior.

## Implementation rules

- Use native form controls before custom widgets.
- Prefer `button type="submit"` inside a real `<form>`.
- Keep client validation and server validation consistent, but do not trust client validation.
- Focus the first invalid field or error summary after failed submit.
- Use `aria-live` carefully for async status messages.
- Avoid placeholder-only labels.
- Keep destructive submissions reversible, confirmable, or reviewable when the consequence is high.

## Testing focus

- Keyboard-only completion.
- Screen reader names, errors, and status announcements.
- Browser autofill and password manager behavior.
- Slow network, duplicate submit, and expired session behavior.
- Mobile keyboard type, input mode, and zoom behavior.

## Reference files

### [`references/accessible-fields.md`](references/accessible-fields.md)
**Accessible HTML field patterns** — Field anatomy with `aria-describedby`, `role="alert"` error containers, correct `autocomplete` values table, required field indication, select/textarea, checkbox/radio fieldsets, show/hide password toggle, mobile `inputmode` values. Use as the HTML baseline for any new form field.

### [`references/submit-state.md`](references/submit-state.md)
**Async submit state machine** — `SubmitState` discriminated union, Preact signal-based submit handler, duplicate-submit guard, submit button with `aria-busy`, global status message with `role="alert"/"status"`, field-level server error injection, `focusFirstError` implementation, multi-step wizard state shape.

### [`references/validation.md`](references/validation.md)
**Validation patterns** — Shared Zod schema definition, client-side validate-on-submit (`safeParse` → `fieldErrors`), matching server-side handler in Netlify Functions, validate-on-blur for long forms, async uniqueness validation, display rules, and anti-patterns table.

## External references

- [W3C Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/)
- [WCAG 2.2: Input Assistance](https://www.w3.org/TR/WCAG22/#input-assistance)
- [MDN: The form element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
- [MDN: autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
