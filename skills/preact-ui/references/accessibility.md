# Accessibility

## Semantic structure

- Use one `<main>` per page; use `<header>`, `<nav>`, `<footer>`, `<aside>` as landmarks.
- Use heading levels (`h1`–`h6`) to reflect document outline — one `h1` per page.
- Use `<section>` and `<article>` where content is self-contained or sectioned.

## Interactive elements

- Use `<button>` for actions, `<a href>` for navigation — never `<div onClick>`.
- Buttons must have a visible label or `aria-label`.
- Links must describe their destination — avoid "click here" or "read more" alone.
- Disabled controls should still be focusable to explain why they are disabled.

## Focus and keyboard

- All interactive elements must be reachable with Tab.
- Focus indicator must be clearly visible in all themes — do not remove `outline` without a replacement.
- Modal dialogs must trap focus inside and return focus to the trigger on close.
- Menus and list widgets should respond to Arrow keys, Home/End, and Escape.

## Forms

- Every field must have a `<label>` associated via `for`/`id` or `aria-label`.
- Error messages must be linked to their field via `aria-describedby`.
- Live error announcements use `role="alert"` or `aria-live="polite"`.

## Images and media

- Every `<img>` needs `alt`; decorative images use `alt=""`.
- Videos need captions; audio needs transcripts.
- Icons used as controls need `aria-label` or adjacent visible text.

## Color and contrast

- Text contrast ratio: 4.5:1 minimum (WCAG AA) against the background.
- Large text (18 pt / 14 pt bold): 3:1 minimum.
- Never convey information by color alone — add a text label, icon, or pattern.
- Test all themes (light, dark, high-contrast) independently.

## ARIA usage

- Prefer native HTML semantics over ARIA when possible.
- Add `role`, `aria-*` only when native semantics are absent or insufficient.
- Do not add `role="button"` to a `<button>` — it is already implicit.
- Use `aria-expanded`, `aria-selected`, `aria-checked` on custom widgets.
- Test with at least one screen reader (NVDA + Firefox, or VoiceOver + Safari).

## Checklist

- [ ] Semantic headings with correct hierarchy
- [ ] Real buttons and links (not divs)
- [ ] Visible focus indicators in all themes
- [ ] Keyboard navigation works end-to-end
- [ ] All form fields are labeled
- [ ] Error messages linked via aria-describedby
- [ ] Sufficient color contrast (4.5:1)
- [ ] No information conveyed by color alone
- [ ] Images have alt text
- [ ] No interaction blocked by pointer-only behavior

