# Responsive Review

Breakpoints to test and layout behaviours to verify at each viewport width.

## Required breakpoints

| Label | Width | Device context |
|---|---|---|
| `xs` | 320px | Smallest common Android / old iPhone SE |
| `sm` | 375px | iPhone base (SE 2nd gen, 14 mini) |
| `md` | 768px | Tablet portrait / large phone landscape |
| `lg` | 1024px | Desktop minimum / tablet landscape |
| `xl` | 1440px | Wide desktop baseline |

Test at each breakpoint using browser devtools device toolbar or by resizing to exact widths.

## Checklist per breakpoint

- [ ] No horizontal scroll bar appears at exact breakpoint width.
- [ ] All content is reachable (no text clipped, no button partially off-screen).
- [ ] Text does not orphan (single word on last line) at body copy sizes.
- [ ] Touch targets remain ≥ 44×44 CSS px at narrow viewports.
- [ ] Layout columns collapse in the correct order (content before sidebar).
- [ ] Navigation is accessible (hamburger menu / bottom nav appears at correct breakpoint).
- [ ] Images scale correctly — no overflow, no excessive whitespace.
- [ ] Tables scroll horizontally or collapse to a stacked layout rather than overflowing.
- [ ] Modals and drawers remain within the viewport.

## Responsive review workflow

```
1. Open Chrome DevTools → Device Toolbar (Cmd/Ctrl+Shift+M)
2. Set to "Responsive" mode, not a preset device
3. Set width to 320px → screenshot → log issues
4. Increase to 375px → look for layout reflow artefacts
5. Set to 768px → verify the tablet grid applies at the correct breakpoint
6. Set to 1024px → verify desktop layout
7. Set to 1440px → check for max-width container alignment
8. Drag slowly between 768–769px to confirm breakpoint fires cleanly
9. Check font scaling: bump browser default font size to 20px and re-test 375px
```

## Image and media responsiveness

```html
<!-- Responsive image with art direction -->
<picture>
  <source
    media="(min-width: 768px)"
    srcset="hero-desktop.webp 1440w, hero-desktop-2x.webp 2880w"
    sizes="100vw"
  />
  <img
    src="hero-mobile.webp"
    srcset="hero-mobile.webp 375w, hero-mobile-2x.webp 750w"
    sizes="100vw"
    alt="..."
    width="375"
    height="250"
    loading="eager"
  />
</picture>
```

Verify:
- Desktop source loads at ≥ 768px, mobile loads below.
- `width`/`height` attributes are present to prevent layout shift.
- No image stretches beyond its intrinsic width (use `max-width: 100%`).

## Common responsive failures

| Failure | Likely cause | Fix |
|---|---|---|
| Text overflows container at 320px | Hardcoded `width` or `min-width` | Use `max-width` + `overflow-wrap: break-word` |
| Button row wraps awkwardly | Fixed `gap` + narrow container | Reduce gap token at `sm` or allow flex-wrap |
| Sidebar does not collapse | Missing breakpoint media query | Add `display: none` at correct breakpoint |
| Full-width section on mobile has horizontal scroll | Negative margin or `calc(100vw - X)` leak | Add `overflow-x: hidden` to layout root cautiously |
| Modal exceeds screen height at xs | No `max-height` + `overflow-y: auto` | Add both; ensure sticky modal header/footer |

## Rules

- Test at all 5 breakpoints — not just "looks fine" on the developer's screen size.
- Issues at `xs` (320px) are `Blocker` if content is unreachable; otherwise `Major`.
- Differences from spec layout at `lg`/`xl` are `Major`; at `xs`/`sm` they are `Minor` unless explicitly specced.
- Zoom to 200% and verify the layout remains functional (WCAG 1.4.4 Resize Text).
