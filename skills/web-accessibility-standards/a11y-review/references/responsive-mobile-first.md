# Responsive and Mobile-First Accessibility

Primary sources:
- WCAG 2.2 guidance on orientation, reflow, text spacing, and target size
- WAI mobile accessibility guidance through WCAG-related practices
- https://www.w3.org/WAI/standards-guidelines/mobile/

---

## Mobile-first principles

- Start from the narrowest layout and add complexity upward via `min-width` media queries.
- Preserve all core content and functionality at small widths — nothing should be "mobile-hidden" that is essential.
- Keep source order meaningful; do not rely on CSS reordering (`order`, `flex-direction: row-reverse`) to create a sensible reading order.
- Make controls large enough for touch and spaced to avoid accidental activation.
- Do not require landscape orientation unless the content is genuinely impossible in portrait (e.g. a video editor).
- Do not require drag, hover, or fine pointer precision when a simpler alternative can work.

---

## Viewport meta tag

Always include and never restrict zoom:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

- Do **not** use `user-scalable=no` or `maximum-scale=1` — these block user zoom, which is a WCAG 1.4.4 failure.
- `initial-scale=1` ensures the page starts at 1:1 pixel density without forcing zoom prevention.

---

## Layout review points

- Check at **320 CSS px wide** (WCAG 1.4.10 Reflow baseline).
- Check **browser zoom at 200%** — content must reflow to a single column without horizontal scrolling.
- Check **text spacing overrides**: 1.5× line height, 0.16em letter spacing, 0.12em word spacing, 2em paragraph spacing (WCAG 1.4.12).
- Verify sticky headers/footers do not entirely obscure focused elements (WCAG 2.4.11).
- Verify dialogs, drawers, and menus remain keyboard-usable and fully visible on small screens.
- Verify orientation change (portrait ↔ landscape) does not break core tasks or lose content.

---

## Touch target sizing

- **WCAG 2.5.8 (AA)**: Touch targets must be at least 24×24 CSS px, or the spacing around a smaller target must compensate.
- Recommended best practice: 44×44 CSS px minimum for primary interactive controls (Apple HIG / Google Material baseline).
- Ensure adequate spacing between adjacent targets to prevent accidental activation.
- Do not stack multiple small clickable items in a tight list without padding.

---

## Touch and pointer interaction

- Provide alternatives to: drag-and-drop (`2.5.7`), multi-finger gestures, path-based swipe gestures (`2.5.1`).
- Do not trigger irreversible actions on `pointerdown` / `touchstart`; allow cancellation on `pointerup` / `touchend` (`2.5.2`).
- Do not rely on hover (`mouseover`, `:hover`) as the only way to reveal critical information or controls — touch devices do not have hover states.
- For hover/focus-triggered content (tooltips, popovers): make it dismissible (Escape), hoverable (user can move mouse to it without it closing), and persistent until dismissed (`1.4.13`).

---

## Motion and animation

- Respect `prefers-reduced-motion: reduce` — wrap non-essential transitions and animations in:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- Parallax effects, auto-playing animations, and large motion effects must be suppressible or absent when reduced motion is preferred.
- No content should flash more than 3 times per second (WCAG 2.3.1).

---

## Color scheme

- Support `prefers-color-scheme: dark` and `prefers-color-scheme: light` where possible.
- Re-verify contrast ratios in both schemes — dark mode can introduce new contrast failures.
- Never use color as the only means to convey information (WCAG 1.4.1).
- Ensure focus indicators remain visible in both color scheme modes.

---

## Implementation guidance

- Prefer fluid layouts (`%`, `vw`, `fr`, `minmax`) over brittle fixed-width containers.
- Keep breakpoint logic simple and mobile-first (`min-width` queries, not `max-width`).
- Preserve heading hierarchy and landmark structure across all breakpoints — do not restructure landmarks at different widths.
- Do not hide essential labels, help text, or error messages at small screen sizes.
- Ensure error messages and validation feedback remain visible after zoom and reflow.
- Test with OS-level large text settings (iOS larger text, Android font size) in addition to browser zoom.
- Use relative units for font sizes (`rem`), line heights (unitless or `em`), and spacing (`em`/`rem`) to respect user text size preferences.
- Avoid `overflow: hidden` on `<body>` or `<html>` in a way that prevents keyboard scroll when a component is open.
