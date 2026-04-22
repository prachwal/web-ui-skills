---
name: frontend-a11y
description: Use when designing, implementing, testing, or reviewing frontend accessibility, semantic HTML, keyboard flow, focus management, ARIA, forms, contrast, motion, responsive behavior, or WCAG 2.2 concerns.
---

# Frontend Accessibility

Use this skill for accessibility work in frontend UI.

## Baseline

- Treat WCAG 2.2 AA as the practical target unless the user specifies another level.
- Start with semantic HTML before ARIA.
- Use ARIA to add missing semantics, not to override native elements that already work.
- Preserve visible focus indicators and logical keyboard order.
- Check both `data-theme="light"` and `data-theme="dark"` when theme or color changes are involved.

## Semantic Structure

- Each page should have one meaningful `h1`.
- Use landmarks intentionally: `header`, `nav`, `main`, `section`, `footer`, and `form`.
- Give icon-only buttons an accessible name with `aria-label` or equivalent visible text.
- Use real buttons for actions and links for navigation.
- Associate form controls with labels.
- Use `fieldset` and `legend` for grouped controls when the group meaning matters.

## Keyboard And Focus

- All interactive controls must be reachable and operable by keyboard.
- Focus order should match visual and reading order.
- Do not remove outlines unless replacing them with an equally visible focus style.
- Manage focus after route changes, dialogs, drawers, and destructive confirmations.
- Escape should close dismissible overlays when that matches user expectations.
- Avoid keyboard traps; if focus is intentionally trapped in a modal, restore focus on close.

## ARIA Rules

- Prefer native controls over custom widgets.
- Do not add `role="button"` to non-button elements unless keyboard handling and focus behavior are fully implemented.
- Keep `aria-expanded`, `aria-controls`, `aria-current`, `aria-invalid`, and `aria-describedby` synchronized with visible state.
- Do not hide focusable content with `aria-hidden="true"`.
- Use live regions sparingly for async status changes that users need to hear.

## Visual And Motion

- Maintain text contrast and non-text contrast across themes.
- Do not rely on color alone for state; pair color with text, shape, icon, or position.
- Text must reflow without overlap at mobile sizes and browser zoom.
- Respect reduced motion preferences for decorative or nonessential animation.
- Ensure hover-only content is also available by keyboard and touch.

## Vue Patterns

- Bind accessible state directly from reactive state so DOM and state cannot drift.
- Use component props for accessible labels when a component renders controls.
- Forward fallthrough attributes when wrapping native controls.
- Test slots and conditional rendering for missing headings, labels, and status text.
- Avoid custom keyboard behavior unless the component truly needs a composite-widget pattern.

## Review Checklist

- Can the main workflow be completed with keyboard only?
- Is the current page and active navigation understandable to a screen reader?
- Are form errors announced and tied to fields?
- Are loading, empty, error, and success states perceivable?
- Does focus remain visible and predictable after interaction?
- Do both light and dark themes preserve contrast?
- Does the layout work at mobile width and with zoomed text?

## Verification

- Use unit tests for conditional labels, ARIA state, and emitted accessibility behavior.
- Use browser verification for focus order, tab stops, theme contrast, and responsive layout.
- Prefer computed-style checks for color/theme bugs.
