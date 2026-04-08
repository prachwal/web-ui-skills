# Mixins

Mixins encapsulate repeatable declaration blocks. Keep them small, parameterized, and side-effect free (no selector output unless the mixin is explicitly a component helper).

---

## When to write a mixin

- The same block of declarations appears in two or more files.
- A pattern requires parameters (size, color, breakpoint, variant).
- A browser workaround must stay consistent everywhere it is used.
- A visual pattern (focus ring, truncation, visually hidden) must be identical across components.

---

## Breakpoints

```scss
// tools/_breakpoints.scss
@use 'sass:map';
@use '../tokens' as t;

// Primitive token — defined once in tokens/_primitive.scss:
// $breakpoints: (sm: 36em, md: 48em, lg: 64em, xl: 80em);

@mixin respond-to($bp) {
  @if not map.has-key(t.$breakpoints, $bp) {
    @error 'Unknown breakpoint "#{$bp}". Available: #{map.keys(t.$breakpoints)}';
  }
  @media (min-width: map.get(t.$breakpoints, $bp)) {
    @content;
  }
}

// Usage
.card {
  padding: t.$space-2;
  @include respond-to(md) { padding: t.$space-4; }
}
```

---

## Typography

### Fluid type scale
```scss
// tools/_typography.scss
@mixin fluid-type($min-size, $max-size, $min-bp: 20rem, $max-bp: 80rem) {
  font-size: clamp(
    #{$min-size},
    calc(#{$min-size} + (#{$max-size} - #{$min-size}) * ((100vw - #{$min-bp}) / (#{$max-bp} - #{$min-bp}))),
    #{$max-size}
  );
}

// Usage
h1 { @include fluid-type(1.5rem, 3rem); }
```

### Truncation
```scss
@mixin truncate($lines: 1) {
  @if $lines == 1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// Usage
.card__title  { @include truncate; }
.card__excerpt { @include truncate(3); }
```

### Visually hidden
```scss
@mixin visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// Usage
.sr-only { @include visually-hidden; }
```

---

## Spacing helpers

```scss
// tools/_spacing.scss
@use '../tokens' as t;

// Stack — vertical spacing between children
@mixin stack($space: t.$space-4) {
  display: flex;
  flex-direction: column;
  gap: $space;
}

// Inline — horizontal spacing between children
@mixin inline-cluster($space: t.$space-2, $align: center) {
  display: flex;
  flex-wrap: wrap;
  gap: $space;
  align-items: $align;
}

// Padding shorthand using the token scale
@mixin padded($v: t.$space-4, $h: t.$space-4) {
  padding: $v $h;
}
```

---

## Focus ring

```scss
// tools/_focus.scss
@use '../tokens' as t;

@mixin focus-ring($color: t.$color-border-focus, $offset: 2px) {
  outline: 2px solid $color;
  outline-offset: $offset;
}

@mixin focus-visible-ring($color: t.$color-border-focus, $offset: 2px) {
  &:focus { outline: none; }
  &:focus-visible { @include focus-ring($color, $offset); }
}

// Usage
.button { @include focus-visible-ring; }
.input  { @include focus-visible-ring(t.$color-accent, 3px); }
```

---

## Color utilities

```scss
// tools/_color.scss
@use 'sass:color';
@use '../tokens' as t;

// Returns black or white depending on background luminance
@function contrast-color($bg) {
  @if color.lightness($bg) > 55% {
    @return t.$color-text-primary;
  } @else {
    @return #fff;
  }
}

// $amount: percentage (0–100) of white to mix in — e.g. tint($blue-500, 20%) adds 20% white.
@function tint($color, $amount) {
  @return color.mix(white, $color, $amount);
}

// $amount: percentage (0–100) of black to mix in — e.g. shade($blue-500, 20%) adds 20% black.
@function shade($color, $amount) {
  @return color.mix(black, $color, $amount);
}
```

---

## Grid helpers

```scss
// tools/_grid.scss
@use '../tokens' as t;

@mixin grid-container($max: 72rem, $padding: t.$space-body) {
  width: 100%;
  max-width: $max;
  margin-inline: auto;
  padding-inline: $padding;
}

@mixin auto-grid($min-col: 16rem, $gap: t.$space-4) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax($min-col, 1fr));
  gap: $gap;
}
```

---

## Theme variant helper

```scss
// tools/_theme.scss
@mixin dark {
  [data-theme="dark"] & { @content; }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) & { @content; }
  }
}

// Usage
.card {
  background: var(--color-surface);
  @include dark { border-color: rgba(255, 255, 255, 0.1); }
}
```

---

## Motion / animation

```scss
// tools/_motion.scss
@use '../tokens' as t;

@mixin transition($props: all, $duration: t.$motion-duration-base, $easing: t.$motion-easing-default) {
  transition: $props $duration $easing;
}

@mixin reduced-motion {
  @media (prefers-reduced-motion: reduce) { @content; }
}

// Usage
.button {
  @include transition(background-color);
  @include reduced-motion { transition: none; }
}
```

---

## Rules

- Mixins must not output selectors unless they are explicitly a component pattern mixin.
- Every mixin parameter should have a default that references a token.
- Keep mixins under ~20 lines; if larger, split into smaller mixins.
- Document parameters with a comment when the mixin is non-obvious.
- Never hard-code a color, spacing, or breakpoint value inside a mixin — use token references.
