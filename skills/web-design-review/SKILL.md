---
name: web-design-review
description: Use when reviewing visual design implementation against design specs, including spacing, typography, color, responsive behavior, component consistency, dark mode, and design token alignment.
---

# Web Design Review Skill

Use this skill when evaluating whether implemented UI matches design intent, reviewing component visual consistency, or auditing design token usage across a codebase.

## Core goals

- Identify gaps between design spec and implementation without re-implementing the design system.
- Surface visual, spacing, and typographic inconsistencies that escape code review.
- Verify responsive behavior matches breakpoint intent, not just "looks OK on my screen".
- Check dark mode and high-contrast correctness against the design spec.
- Flag hardcoded values that should use design tokens.

## Checklist

- [ ] Spacing uses design tokens or the spacing scale — no hardcoded pixel values.
- [ ] Typography uses type scale tokens — no hardcoded `font-size`, `line-height`, or `font-weight`.
- [ ] Color uses design tokens — no hardcoded hex, `rgb()`, or brand color literals in component styles.
- [ ] Components match the design spec at the reviewed breakpoints.
- [ ] Dark mode switches colors through the token layer, not with duplicated style blocks.
- [ ] Component state (hover, focus, active, disabled, error) is implemented at all defined states.
- [ ] Focus indicators are visible, styled to match the design system, and not removed.
- [ ] Icon sizes and stroke weights match the spec.
- [ ] Interactive targets are large enough (≥ 24×24 CSS px as minimum, 44×44 recommended).
- [ ] Animations use the design system duration and easing tokens.
- [ ] Layout does not overflow or collapse at minimum supported viewport width.

## Review workflow

1. Load the implementation side by side with the design file or spec export.
2. Check spacing by inspecting computed values or toggling a spacing overlay.
3. Check typography: `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`.
4. Check color: computed background, text, border, and shadow values against token values.
5. Resize to defined breakpoints and verify layout at each.
6. Toggle dark mode and compare colors at each token role against the dark palette spec.
7. Test all interactive states: hover, focus, active, disabled, loading, error.
8. Verify animations respect `prefers-reduced-motion`.
9. Inspect the DOM for hardcoded values that should be tokens.

## Hardcoded value detector

Use browser devtools or a linter to find hardcoded values. In CSS/SCSS reviews, flag:

```scss
// Bad — hardcoded values
.card {
  padding: 16px;                  // should be var(--space-4) or $space-4
  font-size: 14px;                // should be var(--text-sm)
  color: #1a1a2e;                 // should be var(--color-text-primary)
  border-radius: 8px;             // should be var(--radius-md)
  box-shadow: 0 2px 8px #00000029; // should be var(--shadow-md)
}

// Good — token-based
.card {
  padding: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

## Responsive review points

Check at a minimum:
- `320px` — smallest common mobile viewport
- `375px` — iPhone base
- `768px` — tablet / small landscape
- `1024px` — desktop minimum
- `1440px` — wide desktop baseline

Verify: content does not overflow, text does not truncate unexpectedly, touch targets remain reachable, layout columns collapse at the correct breakpoint.

## Dark mode review

```ts
// Verify token values switch correctly in both modes
// Use browser devtools: toggle prefers-color-scheme via emulated media
// Check each token category: text, background, border, shadow, icon, interactive state
```

Common dark mode failures:
- Hardcoded `color: black` or `background: white` that did not go through a token.
- Images and SVG icons that are not adjusted for dark backgrounds.
- Focus ring colors that disappear against dark surfaces.
- Third-party embed backgrounds that do not switch.

## Motion and animation review

```css
/* Every animation must respect this */
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

Flag animations that:
- Use `transition: all` — too broad, hard to reduce safely.
- Have durations > 400ms on common interactive elements.
- Loop infinitely without a pause or stop mechanism.
- Are not covered by the reduced-motion override.

## Reporting findings

Use a consistent severity scale:

| Severity | Meaning |
|---|---|
| `Blocker` | Breaks design intent significantly or causes accessibility failure |
| `Major` | Visible deviation from spec or token misuse that affects multiple components |
| `Minor` | Small spacing, size, or color deviation within one component |
| `Enhancement` | Improvement beyond spec that would be a nice addition |

Include: screenshot, element selector or component name, expected value, actual computed value, token or spec reference.

## References

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [prefers-color-scheme (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [WCAG 2.2: 1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)
- [WCAG 2.2: 2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum)
