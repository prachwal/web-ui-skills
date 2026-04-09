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

## References

- [W3C Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/)
- [WCAG 2.2: Input Assistance](https://www.w3.org/TR/WCAG22/#input-assistance)
- [MDN: The form element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
- [MDN: autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
