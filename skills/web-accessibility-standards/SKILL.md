---
name: web-accessibility-standards
description: Use when implementing accessible web interfaces, especially semantic HTML, ARIA, keyboard support, responsive mobile-first layouts, focus management, dynamic content, and automated accessibility checks. For audits and QA passes, use the `a11y-review` skill in the same repository.
---

# Web Accessibility Standards Skill

Use this skill for implementation work on accessible web interfaces. It is optimized for CLI tools and AI code-generation agents that produce or refactor UI code. If the task is primarily an audit, review, or compliance pass, use the `a11y-review` skill from the same repository.

---

## Core position

1. Start with semantic HTML before adding ARIA.
2. Treat WCAG 2.2 as the current review and implementation baseline.
3. Prefer mobile-first, responsive layouts that preserve meaning and operability.
4. Accessibility is behavior plus semantics — not only labels and contrast.
5. Review with keyboard, focus, screen-reader semantics, zoom/reflow, and touch targets in mind.
6. Automate what can be automated; use static analysis and axe-core in CI pipelines.
7. Test with real assistive technology for interactive widgets and critical user flows.

---

## Workflow

1. Identify the task type:
   - new UI design or page scaffold
   - component implementation
   - responsive/mobile fix
   - ARIA/widget work
   - dynamic content update (SPA navigation, live regions, modals)
   - automated accessibility test integration
2. Use native HTML semantics first.
3. Add ARIA only when native HTML does not express the needed interaction or state.
4. Check keyboard behavior and visible focus early in the development cycle, not at the end.
5. Validate layout and content flow at narrow widths and in zoomed/reflowed states.
6. For interactive widgets, use WAI-ARIA APG patterns as the implementation reference.
7. For compliance-sensitive work, map implementation choices to WCAG 2.2 success criteria.
8. Integrate automated accessibility checks (axe-core, Lighthouse CI) into the build/test pipeline.

---

## Practical rules

- Prefer real buttons, links, inputs, labels, tables, lists, headings, and landmarks over custom elements.
- Never add ARIA that overrides correct native semantics without a documented reason.
- If you assign an ARIA role, implement the full keyboard behavior that role implies.
- Keep DOM order and reading order aligned with the visual order.
- Ensure focus indicators are visible and not obscured by sticky headers, overlays, or CSS.
- Ensure touch targets are at least 24×24 CSS px (AA) with adequate spacing.
- Avoid pointer-only, drag-only, hover-only, and orientation-dependent interaction.
- Support zoom, reflow, and text spacing overrides without losing content or function.
- Every image needs a meaningful or empty (`alt=""`) alternative text — never omit `alt`.
- Use `lang` on `<html>` and on any inline content in a different language.
- Avoid `tabindex` values greater than 0; manage focus order through DOM structure.
- Never remove the browser's default `:focus` style without replacing it with a visible alternative.
- For animations and motion: respect `prefers-reduced-motion` and keep non-essential animation off by default in that context.
- For color and contrast: do not rely on color alone to convey meaning; ensure 4.5:1 for normal text (AA), 3:1 for large text and UI components.

---

## Practical guidance for building accessible applications with a CLI or AI agent

### Starting a new project

When scaffolding a new web application, instruct the CLI or agent to:

1. Set `lang` on `<html>` from the start — e.g. `lang="en"`.
2. Include a single `<h1>` per page/view that reflects the current page title or route.
3. Use landmark elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) for every major region.
4. Ensure the `<title>` element is descriptive and changes on navigation in SPAs.
5. Add a skip-navigation link as the first focusable element: `<a href="#main-content" class="skip-link">Skip to main content</a>`.
6. Include the viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">` — do not set `user-scalable=no`.
7. Set a base font size in relative units (`rem`) and avoid fixed `px` font sizes.
8. Configure your CSS reset or base styles to provide a visible `:focus-visible` indicator.

### Adding components

When generating a UI component, the agent should:

1. Prefer HTML elements with built-in semantics (`<button>`, `<a>`, `<input>`, `<select>`, `<details>`, `<dialog>`).
2. For custom interactive components (tabs, accordions, comboboxes, menus, trees, carousels), follow the corresponding WAI-ARIA APG pattern — see [references/aria-apg.md](references/aria-apg.md).
3. Always provide an accessible name: via visible label text, `aria-label`, or `aria-labelledby`. Never rely on placeholder text as the only label.
4. For icon-only controls, add visually hidden label text or `aria-label`.
5. For form fields: associate `<label>` with `for`/`id`, link error messages with `aria-describedby`, and mark required fields with `required` or `aria-required="true"`.
6. For dialogs: use `<dialog>` or `role="dialog"` with `aria-labelledby`, trap focus inside, and restore focus on close.
7. For navigation menus: use `<nav>` with a distinct `aria-label` when multiple `<nav>` elements exist.

### Dynamic content and SPA navigation

Single-page applications need extra work to maintain accessibility across client-side route changes:

- After a route change, update `<title>`, move focus to the new `<h1>` or main content region, and announce the navigation with a live region or focus management.
- Use `aria-live="polite"` regions to announce non-disruptive status messages (form saves, search results count).
- Use `aria-live="assertive"` only for urgent messages (errors that block the user).
- Keep live region elements in the DOM from page load — injecting them dynamically is unreliable.
- For async data loading: indicate loading state with `aria-busy="true"` on the container, then remove it and announce the result.
- Avoid `setTimeout`-based focus management; use callbacks or promise resolution tied to DOM readiness.

### Keyboard and focus management

- Every interactive feature must be reachable and operable by keyboard alone (Tab, Shift+Tab, Enter, Space, arrow keys as appropriate).
- Arrow key navigation is expected inside composite widgets (menus, tab lists, radio groups, listboxes, trees). Use `roving tabindex` or `aria-activedescendant` patterns.
- Modals, drawers, and popovers must trap focus while open and return focus to the trigger element when closed.
- Avoid keyboard traps that prevent users from tabbing out of a component.
- In SPAs, set `tabindex="-1"` on the target heading or container when programmatically moving focus.

### Automated testing integration

Include automated accessibility checks in the development pipeline:

- **Unit/component tests**: integrate `jest-axe` or `@testing-library` + axe-core to run axe on rendered component output.
- **End-to-end tests**: run `axe` via Playwright (`@axe-core/playwright`) or Cypress (`cypress-axe`) on key pages.
- **CI pipeline**: run Lighthouse CI (`lhci`) or Pa11y CI on critical routes on every pull request.
- Automated tools catch ~30–40 % of accessibility issues; combine with manual keyboard testing and screen-reader spot checks.
- Configure axe to fail the build on `critical` and `serious` violations, warn on `moderate` and `minor`.

### Framework-specific notes

**React:**
- Use `useRef` + `.focus()` for programmatic focus management after state changes.
- Prefer `<>` fragments over wrapper `<div>` to avoid polluting landmark structure.
- Use `aria-live` regions declared in the root layout, not in leaf components that mount/unmount.

**Vue:**
- Use `$nextTick` + `.focus()` after reactive DOM updates that require focus movement.
- Use `v-bind="$attrs"` on root elements in wrapper components to propagate ARIA attributes.
- Declare live region containers in the root `App.vue` layout.

**Angular:**
- Use `FocusTrap` from `@angular/cdk/a11y` for dialogs and overlays.
- Use the `LiveAnnouncer` service from `@angular/cdk/a11y` for programmatic announcements.
- Avoid `ChangeDetectionStrategy.OnPush` silently blocking ARIA attribute updates.

**Web Components / Custom Elements:**
- Reflect ARIA attributes to the host element so the accessibility tree is correct in both shadow DOM and light DOM contexts.
- Use `ElementInternals` to expose form participation and ARIA semantics from within a closed shadow root.

---

## Common anti-patterns to avoid

| Anti-pattern | Problem | Correct approach |
|---|---|---|
| `<div onclick>` or `<span role="button">` without keyboard handler | Not keyboard operable | Use `<button>` or add `keydown` for Enter/Space |
| `placeholder` as the only label | Disappears on input, poor AT support | Use `<label>` always |
| `aria-label` on a `<div>` with no role | No semantic benefit | Add a meaningful role or restructure |
| `display:none` focus management | Hides element from AT entirely | Use `tabindex="-1"` to remove from tab order while keeping in DOM; use `aria-hidden="true"` (+ ensure not focusable) to hide decorative content from AT |
| `outline: none` / `outline: 0` globally | Removes visible focus | Override only with a visible alternative via `:focus-visible` |
| Relying on `aria-hidden` to suppress decorative content that is still in tab order | AT hides element, keyboard still reaches it | Also set `tabindex="-1"` or remove from DOM |
| Injecting `aria-live` regions on demand | Announcements may be missed | Declare live regions in the DOM from initial load |
| Hardcoded `px` font sizes | Breaks browser zoom and text-size user preferences | Use `rem` for font sizes |
| `user-scalable=no` in viewport meta | Prevents zoom — direct WCAG failure | Remove or replace with `minimum-scale=1` |

---

## Debugging and inspection

For CLI and AI agent workflows, use these approaches when reviewing generated code:

- Parse the HTML and check: one `<h1>`, all `<img>` have `alt`, all `<input>` have an associated `<label>` or `aria-label`, all `<button>` have non-empty text or `aria-label`.
- Run `axe-core` programmatically in a headless browser (Playwright, Puppeteer) and parse the JSON output.
- Use the browser's built-in Accessibility Tree panel (DevTools → Elements → Accessibility) to verify computed accessible names and roles.
- Use keyboard tab-through to verify focus order and visible focus indicators.
- Screen readers to test with: NVDA + Chrome on Windows, VoiceOver + Safari on macOS/iOS, TalkBack on Android.

---
## When to consult which reference

- Read [references/wcag-22.md](references/wcag-22.md) when the task needs standards mapping, review findings, or precise success criteria.
- Read [references/aria-apg.md](references/aria-apg.md) when implementing widgets, landmarks, names, descriptions, live regions, or keyboard interaction patterns.
- Read [references/responsive-mobile-first.md](references/responsive-mobile-first.md) when building layouts, breakpoints, or touch/mobile interactions.
- For audits, findings, and QA checklists, switch to [a11y-review/SKILL.md](../a11y-review/SKILL.md).

## Output expectations

- Call out the relevant WCAG 2.2 criterion (number and name) when the change directly maps to one.
- Mention keyboard and focus implications for every interactive component.
- Include responsive/mobile implications when layout, targets, or touch interaction are involved.
- Avoid recommending ARIA where native HTML already solves the problem.
- For generated code: always include `alt`, `lang`, `<label>`, and visible focus styles — never omit them as "details to add later".
- For review output: distinguish between WCAG failures (must fix), best-practice issues (should fix), and enhancements (consider).
