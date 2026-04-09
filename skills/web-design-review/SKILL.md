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

## Reference files

### [`references/token-audit.md`](references/token-audit.md)
**Hardcoded value detection** — Bad vs. good SCSS examples for all token categories (spacing, typography, color, radius, shadow, animation, z-index), grep patterns for automated scanning, token category checklist table, rules for deciding when a value needs a token vs. when it is an intrinsic reset.

### [`references/responsive.md`](references/responsive.md)
**Responsive review workflow** — Required breakpoints table (320/375/768/1024/1440px with device context), per-breakpoint checklist, step-by-step devtools workflow, `<picture>` responsive image example, common responsive failure table (overflow, wrap, collapse) with causes and fixes, severity guidance.

### [`references/motion-dark.md`](references/motion-dark.md)
**Motion safety and dark mode correctness** — Global `prefers-reduced-motion` CSS override block, devtools emulation steps, animation patterns to flag with severity table, dark mode checklist, common dark mode failure table with fixes, SCSS dual-palette token pattern, severity reporting table.

## External references

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [prefers-color-scheme (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [WCAG 2.2: 1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)
- [WCAG 2.2: 2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum)
