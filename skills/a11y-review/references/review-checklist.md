# Accessibility Review Checklist

Use this as a compact QA pass for manual reviews and as a structured prompt for CLI/AI agent review tasks.

---

## Semantics

- [ ] One clear, descriptive `<h1>` per page or view
- [ ] Meaningful heading hierarchy (`h1` → `h2` → `h3`; no skipped levels)
- [ ] Real `<button>` for actions, real `<a>` with `href` for navigation
- [ ] All `<input>`, `<select>`, `<textarea>` have an associated `<label>` (not placeholder-only)
- [ ] `<form>` fields with errors have error text linked via `aria-describedby`
- [ ] Tables use `<th>` with `scope`, and have captions or `aria-label` where needed
- [ ] Lists are marked up as `<ul>`, `<ol>`, or `<dl>` — not as visual-only paragraphs
- [ ] Landmarks cover all major regions: `<header>`, `<nav>`, `<main>`, `<footer>`, and `<aside>` where applicable
- [ ] Multiple `<nav>` elements have distinct `aria-label` values
- [ ] `<html lang="…">` is set; inline language changes use `lang` on the element
- [ ] `<title>` is descriptive and updated on SPA route changes

---

## Keyboard

- [ ] Every interactive element is reachable by Tab / Shift+Tab
- [ ] No keyboard traps (user can always Tab out of any component)
- [ ] Logical and predictable tab order that matches visual/reading order
- [ ] Visible focus indicator on every focusable element (not removed globally)
- [ ] Dialogs and modals trap focus while open and restore focus to the trigger on close
- [ ] Composite widgets (menus, tabs, listboxes, trees) use arrow key navigation as per APG
- [ ] Custom interactive components respond to Enter and/or Space as expected by their role
- [ ] No content or function is accessible only through mouse/pointer

---

## Names and descriptions

- [ ] All interactive controls have a non-empty accessible name
- [ ] Icon-only buttons have `aria-label` or visually hidden label text
- [ ] Image `alt` is present on every `<img>`; decorative images use `alt=""`
- [ ] `aria-label` and `aria-labelledby` values accurately describe the element
- [ ] Error messages are associated to the field via `aria-describedby`
- [ ] Status and validation messages are announced via live regions or `role="status"` / `role="alert"`
- [ ] `2.5.3 Label in Name`: visible label text is contained in or matches the accessible name

---

## Responsive and mobile

- [ ] Works at 320 CSS px wide without horizontal scrolling (WCAG 1.4.10 Reflow)
- [ ] Works at 200% browser zoom without loss of content or function
- [ ] Text spacing overrides (line height, letter, word, paragraph spacing) do not break layout
- [ ] Touch targets are at least 24×24 CSS px (WCAG 2.5.8 AA); recommended 44×44 px
- [ ] No essential hover-only or drag-only interaction
- [ ] No orientation restriction (portrait/landscape) unless truly essential
- [ ] Viewport meta does not prevent user zoom (`user-scalable=no` absent)

---

## Visual accessibility

- [ ] Normal text contrast: ≥ 4.5:1 (WCAG 1.4.3 AA)
- [ ] Large text contrast (18pt / 14pt bold): ≥ 3:1
- [ ] UI component and graphical element contrast: ≥ 3:1 (WCAG 1.4.11)
- [ ] Color is not the sole means of conveying meaning (WCAG 1.4.1)
- [ ] Text remains readable with user text spacing overrides (WCAG 1.4.12)
- [ ] Focus indicators are visible against their backgrounds
- [ ] Dark mode / `prefers-color-scheme`: contrast ratios re-verified in dark scheme
- [ ] No content flashes more than 3 times per second (WCAG 2.3.1)

---

## Animation and motion

- [ ] Non-essential animations respect `prefers-reduced-motion: reduce`
- [ ] Auto-playing animations can be paused, stopped, or hidden (WCAG 2.2.2)
- [ ] Parallax and large-motion effects suppressed under `prefers-reduced-motion`

---

## ARIA

- [ ] ARIA is used only where native HTML does not provide the required semantics
- [ ] Every assigned role has its keyboard behavior fully implemented
- [ ] `aria-expanded`, `aria-selected`, `aria-pressed`, `aria-checked` states are updated dynamically
- [ ] `aria-hidden="true"` elements are also removed from tab order (`tabindex="-1"` or not focusable)
- [ ] APG patterns are followed for complex widgets (tabs, menus, dialogs, comboboxes, etc.)
- [ ] Live regions are declared in the DOM from initial load, not injected dynamically
- [ ] `aria-live` regions use `polite` for non-urgent and `assertive` only for urgent/interrupting messages

---

## Authentication and forms

- [ ] Login/authentication does not require solving a cognitive test when a password manager can fill credentials (WCAG 3.3.8 AA)
- [ ] Multi-step forms preserve previously entered data on back-navigation (WCAG 3.3.7)
- [ ] Required fields are identified (via `required`, `aria-required`, or visible label)
- [ ] Error prevention: consequential submissions (purchases, deletions) can be reviewed, confirmed, or reversed (WCAG 3.3.4)

---

## Automated testing tools

Use these tools as the first line of automated checking (they catch ~30–40% of issues):

| Tool | Use case |
|---|---|
| `axe-core` (browser extension or CLI) | In-page and CI violation scanning |
| `@axe-core/playwright` | End-to-end accessibility tests with Playwright |
| `cypress-axe` | End-to-end accessibility tests with Cypress |
| `jest-axe` | Unit/component-level accessibility tests with Jest |
| Lighthouse CI (`lhci`) | Automated audit on key routes in CI pipelines |
| Pa11y / Pa11y CI | CLI-based WCAG scanning on URLs |
| `eslint-plugin-jsx-a11y` | Static analysis for React JSX accessibility issues |
| `axe DevTools` browser extension | Manual in-browser guided scanning |
| Chrome DevTools Accessibility pane | Inspect accessibility tree and computed names/roles |

Configure automated tools to **fail the build** on `critical` and `serious` violations, and **warn** on `moderate` and `minor`.

> **Note**: Automated tools are estimated to detect roughly 30–40% of accessibility issues (a widely cited industry estimate based on studies such as the WebAIM Million report and Deque axe research). They are a necessary starting point, not a complete substitute for manual keyboard testing and screen-reader spot checks.
