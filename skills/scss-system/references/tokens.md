# Tokens

Tokens are the foundation of every SCSS system. They encode design decisions as named values, making the system maintainable, themeable, and consistent.

---

## Two-layer model

### Primitive tokens
Raw, scale-based values with no semantic meaning. Named after what they are.

```scss
// tokens/_primitive.scss
$blue-100: #e8f0fe;
$blue-500: #1a73e8;
$blue-900: #0d47a1;

$space-1: 0.25rem;   // 4px
$space-2: 0.5rem;    // 8px
$space-4: 1rem;      // 16px
$space-8: 2rem;      // 32px

$font-size-sm: 0.875rem;
$font-size-base: 1rem;
$font-size-lg: 1.25rem;
$font-size-xl: 1.5rem;

$radius-sm: 2px;
$radius-md: 6px;
$radius-lg: 12px;
$radius-full: 9999px;
```

### Semantic tokens
Aliases that map primitive values to purpose. These are what component files use.

```scss
// tokens/_semantic.scss
@use 'primitive' as p;

// Color — surface
// Define intermediate primitive steps like $blue-200/$blue-700 in _primitive.scss;
// avoid calling darken()/lighten() at the semantic layer so themes can override independently.
$color-surface:         p.$blue-100 !default;
$color-surface-muted:   p.$blue-200 !default;
$color-surface-raised:  #fff !default;

// Color — text
$color-text-primary:    p.$blue-900 !default;
$color-text-secondary:  p.$blue-700 !default;
$color-text-disabled:   #999 !default;
$color-text-on-accent:  #fff !default;

// Color — interactive
$color-accent:          p.$blue-500 !default;
$color-accent-hover:    darken(p.$blue-500, 8%) !default;
$color-accent-active:   darken(p.$blue-500, 14%) !default;

// Color — feedback
$color-success:         #1e8c45 !default;
$color-warning:         #c77700 !default;
$color-error:           #c62828 !default;

// Color — border
$color-border:          rgba(0, 0, 0, 0.12) !default;
$color-border-focus:    p.$blue-500 !default;

// Spacing
$space-body:            p.$space-4 !default;
$space-section:         p.$space-8 !default;
$space-component-gap:   p.$space-2 !default;

// Radius
$radius-button:         p.$radius-md !default;
$radius-card:           p.$radius-lg !default;
$radius-input:          p.$radius-sm !default;
```

---

## Token groups

| Group | Primitive file | Semantic names |
|---|---|---|
| Color | `_primitive.scss` | `$color-surface`, `$color-text-*`, `$color-accent`, `$color-border` |
| Typography | `_typography.scss` | `$font-family-body`, `$font-size-*`, `$line-height-*`, `$font-weight-*` |
| Spacing | `_primitive.scss` | `$space-body`, `$space-section`, `$space-component-gap` |
| Radius | `_primitive.scss` | `$radius-button`, `$radius-card`, `$radius-input` |
| Shadow | `_shadow.scss` | `$shadow-sm`, `$shadow-md`, `$shadow-lg` |
| Motion | `_motion.scss` | `$motion-duration-fast`, `$motion-duration-base`, `$motion-easing-default` |
| Z-index | `_z-index.scss` | `$z-dropdown`, `$z-modal`, `$z-toast`, `$z-overlay` |
| Breakpoints | `_primitive.scss` | `$breakpoints` map: `sm`, `md`, `lg`, `xl` |

---

## Typography tokens

```scss
// tokens/_typography.scss
$font-family-body:    system-ui, -apple-system, 'Segoe UI', sans-serif !default;
$font-family-mono:    'JetBrains Mono', 'Fira Code', monospace !default;
$font-family-heading: inherit !default;

$font-weight-regular: 400 !default;
$font-weight-medium:  500 !default;
$font-weight-bold:    700 !default;

$line-height-tight:   1.25 !default;
$line-height-base:    1.5 !default;
$line-height-loose:   1.75 !default;

$letter-spacing-tight: -0.02em !default;
$letter-spacing-base:   0 !default;
$letter-spacing-wide:   0.06em !default;
```

---

## Motion tokens

```scss
// tokens/_motion.scss
$motion-duration-fast:    100ms !default;
$motion-duration-base:    200ms !default;
$motion-duration-slow:    400ms !default;

$motion-easing-default:   cubic-bezier(0.4, 0, 0.2, 1) !default;
$motion-easing-enter:     cubic-bezier(0, 0, 0.2, 1) !default;
$motion-easing-exit:      cubic-bezier(0.4, 0, 1, 1) !default;

$motion-reduced:          false !default; // override via @use with config
```

---

## Z-index tokens

```scss
// tokens/_z-index.scss
$z-base:      0 !default;
$z-raised:    10 !default;
$z-dropdown:  100 !default;
$z-sticky:    200 !default;
$z-overlay:   300 !default;
$z-modal:     400 !default;
$z-toast:     500 !default;
$z-tooltip:   600 !default;
```

---

## CSS custom properties integration

Export semantic tokens as custom properties in `base/_root.scss` for runtime theming:

```scss
// base/_root.scss
@use '../tokens' as t;

:root {
  --color-surface:       #{t.$color-surface};
  --color-text-primary:  #{t.$color-text-primary};
  --color-accent:        #{t.$color-accent};
  --space-body:          #{t.$space-body};
  --radius-card:         #{t.$radius-card};
  --shadow-md:           #{t.$shadow-md};
  --motion-duration:     #{t.$motion-duration-base};
}
```

In component files, choose between SCSS variables (compile-time) and CSS custom properties (runtime):
- Use SCSS variables for values that are always the same at compile time.
- Use CSS custom properties when a value must change at runtime (theme toggle, user preference).

---

## Rules

- Use `!default` on every token so downstream consumers can override with `@use 'tokens' with (…)`.
- Never reference a primitive token in a component file — always go through semantic.
- Never define a raw color or spacing value in a component — add a token if one is missing.
- Keep primitive and semantic tokens in separate files; never merge them.
