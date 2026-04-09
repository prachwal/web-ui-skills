# Motion and Dark Mode Review

CSS patterns and review checklists for reduced-motion compliance and dark mode correctness.

## Reduced-motion override

Every CSS animation and transition must be covered by this block:

```css
/* Place in global stylesheet, applied last */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Emulate in devtools

Chrome: DevTools → More tools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`  
Firefox: DevTools → Accessibility → Simulate → Prefers reduced motion

### Animations to flag

| Pattern | Severity | Reason |
|---|---|---|
| `transition: all` | `Major` | Cannot be safely scoped or reduced |
| Infinite loop with no pause | `Major` | Violates WCAG 2.3.3 (AAA) and distresses users |
| Duration > 400ms on interactive element | `Minor` | Feels sluggish, hard to reduce |
| Parallax scroll effect | `Major` | Must be removed entirely under reduced-motion |
| Auto-playing carousel | `Blocker` | Must stop or pause under reduced-motion |
| CSS `scroll-behavior: smooth` without override | `Minor` | Causes vestibular issues |

## Dark mode review checklist

Enable dark mode via: `@media (prefers-color-scheme: dark)` emulation in DevTools or OS settings.

- [ ] All text has sufficient contrast against dark backgrounds (WCAG AA ≥ 4.5:1 for body, ≥ 3:1 for large text).
- [ ] Focus rings are visible against dark surfaces.
- [ ] Borders and dividers are visible.
- [ ] Icon colors switch — no black icons on dark backgrounds.
- [ ] Shadows remain subtle and do not make elements invisible.
- [ ] Images have not inverted or become unreadable.
- [ ] Third-party embeds (maps, social widgets) are acceptable in dark context.
- [ ] Form inputs have correct dark background/border.

## Common dark mode failures

| Failure | Likely cause | Fix |
|---|---|---|
| Text unreadable | Hardcoded `color: black` | Replace with `var(--color-text-primary)` token |
| White flash on load | JavaScript-driven theme applied after render | Apply `color-scheme` on `<html>` via `<meta>` or SSR class |
| SVG icon invisible | `fill: currentColor` missing or hardcoded `#000` fill | Use `fill: currentColor`; let theme drive the text color |
| Input background stays white | No dark-mode style for `input` background | Add `background-color: var(--color-input-bg)` token |
| Focus ring disappears | `outline-color: var(--color-interactive)` token not set for dark | Verify token dark value and contrast |

## Dark mode SCSS pattern

```scss
// tokens/_colors.scss — define both palettes
:root {
  --color-text-primary: #1a1a2e;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-interactive: #2563eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #f1f5f9;
    --color-surface: #1e293b;
    --color-border: #334155;
    --color-interactive: #60a5fa;
  }
}

// If also supporting manual dark class:
.dark {
  --color-text-primary: #f1f5f9;
  --color-surface: #1e293b;
  // ...
}
```

## Reporting severity table

| Severity | Meaning |
|---|---|
| `Blocker` | Breaks design intent significantly or causes accessibility failure |
| `Major` | Visible deviation from spec or token misuse that affects multiple components |
| `Minor` | Small deviation within a single component |
| `Enhancement` | Improvement beyond spec |

Include in every finding: screenshot, selector or component name, expected value, actual computed value, token or spec reference.

## Rules

- Every animation must be testable with `prefers-reduced-motion: reduce` — verify it goes inert or disappears cleanly.
- Dark mode token mismatches are always at least `Minor`; missing contrast is `Blocker`.
- Use `color-scheme: light dark` on `:root` or `<html>` so browser chrome (scrollbars, inputs) follows the theme.
- Do not rely solely on OS dark mode; also test with the explicit `.dark` class if supported.
