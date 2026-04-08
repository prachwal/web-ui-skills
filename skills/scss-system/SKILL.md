---
name: scss-system
description: Use when designing, building, or refactoring SCSS-based design systems, component libraries, or application stylesheets. Covers tokens, mixins, functions, color palettes, typography, spacing, responsiveness, theming, folder architecture, and CLI workflow.
---

# SCSS System Skill

Use this skill when working on any SCSS styling task: starting a new design system, extending an existing one, scaffolding a component library, or maintaining a large application stylesheet. It guides both the architecture decisions and the practical CLI steps needed to produce correct, scalable output.

---

## Core principles

1. **Start from tokens, not components.** Every value a component uses must trace back to a token.
2. **Semantic over raw.** Use `$color-surface` in component files, never `#fff`.
3. **Single source of truth.** Spacing scale, type scale, breakpoints, and palette live in one place.
4. **Composability.** Small, focused partials that do one thing compose better than monolithic sheets.
5. **Responsive and themeable by default.** Treat breakpoints and theme variants as first-class concerns, not afterthoughts.
6. **Low and predictable specificity.** Avoid `!important`, deep nesting, and long selector chains.

---

## Framework methodology: folder split and responsibilities

A production SCSS framework is divided into layers. Each layer has a single responsibility and a strict dependency direction: lower layers never import upper ones.

```
styles/
├── tokens/          # 1. Raw and semantic design values (no CSS output alone)
├── tools/           # 2. Functions and mixins (no CSS output alone)
├── base/            # 3. Reset, root variables, global typography
├── layout/          # 4. Grid, containers, page scaffolding
├── components/      # 5. Reusable UI blocks
├── patterns/        # 6. Multi-component compositions (cards+lists, hero+cta)
├── pages/           # 7. Page-specific overrides (used sparingly)
├── utilities/       # 8. Single-purpose helper classes
├── themes/          # 9. Color-scheme and brand overrides
└── main.scss        # Entry point — imports all layers in order
```

### Layer responsibilities

| Layer | Responsibility | Imports from |
|---|---|---|
| `tokens/` | All design values: color, space, type, radius, shadow, motion, z-index | nothing |
| `tools/` | Mixins and functions that consume tokens | `tokens/` |
| `base/` | CSS reset, `:root` custom properties, body defaults | `tokens/`, `tools/` |
| `layout/` | Page grid, containers, section scaffolding | `tokens/`, `tools/` |
| `components/` | Self-contained UI blocks with states | `tokens/`, `tools/` |
| `patterns/` | Compositions of multiple components | `tokens/`, `tools/`, `components/` |
| `pages/` | Route- or view-specific tweaks | any layer above |
| `utilities/` | Atomic helpers: `.visually-hidden`, `.truncate`, margin/padding scales | `tokens/`, `tools/` |
| `themes/` | Light/dark, brand, high-contrast overrides | `tokens/` |

### Tokens subfolder split

```
styles/tokens/
├── _primitive.scss   # Raw scale: $blue-500, $space-4, $font-size-base
├── _semantic.scss    # Aliases: $color-surface → $blue-50, $space-body → $space-4
├── _typography.scss  # Font families, weights, line-heights, size scale
├── _motion.scss      # Duration, easing, reduced-motion flag
├── _shadow.scss      # Elevation scale
├── _z-index.scss     # Layering constants
└── _index.scss       # Forwards all token partials
```

### Tools subfolder split

```
styles/tools/
├── _breakpoints.scss  # $breakpoints map + respond-to() mixin
├── _spacing.scss      # space() function, stack/inline mixins
├── _typography.scss   # fluid-type(), truncate(), visually-hidden()
├── _color.scss        # contrast-color(), tint(), shade()
├── _focus.scss        # focus-ring() mixin
├── _grid.scss         # grid-container(), grid-area() helpers
└── _index.scss        # Forwards all tools
```

---

## Workflow

### Starting a new system

1. Create the folder tree shown above.
2. Define **primitive tokens** first (raw palette, numeric scale).
3. Map **semantic tokens** on top (surface, text, border, accent).
4. Write `base/` reset and `:root` custom properties.
5. Build `tools/` mixins referencing tokens — no hard-coded values.
6. Scaffold component partials one at a time, importing only what they need.
7. Add `themes/` overrides last, reusing semantic token names.

### Adding a new component

1. Create `styles/components/_component-name.scss`.
2. At the top, use `@use '../tokens' as t` and `@use '../tools' as m`.
3. Define the component root selector; add BEM element and modifier selectors inside.
4. Reference tokens for every value: `color: t.$color-text-primary`.
5. Call mixins for responsive behavior: `@include m.respond-to(md) { … }`.
6. Do not define any raw color, spacing, or size value inline.

### Extending an existing system

1. Identify which layer the change belongs to (token, mixin, component, theme).
2. Change the token if the value should ripple everywhere.
3. Change the mixin if a pattern is being updated system-wide.
4. Change the component partial if only that component is affected.
5. Never override tokens by redefining them in a component — use a modifier class or the theme layer.

### CLI steps for a typical task

```bash
# Scaffold the folder tree
mkdir -p styles/{tokens,tools,base,layout,components,patterns,pages,utilities,themes}

# Create entry point
touch styles/main.scss

# Create token index files
touch styles/tokens/_index.scss styles/tokens/_primitive.scss styles/tokens/_semantic.scss

# Create tools index
touch styles/tools/_index.scss styles/tools/_breakpoints.scss

# Compile and watch (Sass CLI)
sass --watch styles/main.scss:dist/main.css --style=compressed

# Compile once with source maps
sass styles/main.scss dist/main.css --style=expanded --source-map

# Check for deprecation warnings
sass styles/main.scss --quiet-deps

# Lint with stylelint
npx stylelint "styles/**/*.scss" --fix
```

---

## Practical tips for application development

### Module system
- Always use `@use` and `@forward`, never `@import` (deprecated since Dart Sass 1.23, removed in 2.0).
- Each file should `@use` only what it directly needs — no wildcard forwarding in leaf files.
- Use `@forward` in `_index.scss` files so consumers can `@use '../tokens'` as a single namespace.
- Pass configuration with `@use 'tokens' with ($color-brand: #0055ff)` at the entry point only.

### Performance
- Split the compiled output by page or feature if the app is large; avoid one giant CSS bundle.
- Use `sass --no-source-map` in production builds.
- Tree-shake by keeping `utilities/` classes in a separate file loaded only on pages that need them.

### Theming
- Define all color tokens as CSS custom properties in `:root` for runtime switching without a rebuild.
- Use `prefers-color-scheme` in the SCSS theme layer for automatic dark mode.
- Allow an explicit `[data-theme="dark"]` attribute to override the media query for a user toggle.

```scss
// themes/_dark.scss
// Dark-mode semantic token overrides — add $color-surface-dark and
// $color-text-primary-dark to tokens/_semantic.scss with !default.
@use '../tokens' as t;

@mixin dark-vars {
  --color-surface: #{t.$color-surface-dark};
  --color-text-primary: #{t.$color-text-primary-dark};
}

:root { @include dark-vars; }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { @include dark-vars; }
}

[data-theme="dark"] { @include dark-vars; }
```

### Responsive design
- Centralize all breakpoint values in `tokens/_primitive.scss`.
- Use a single `respond-to($bp)` mixin from `tools/_breakpoints.scss`.
- Write mobile-first: base styles apply to all sizes, breakpoints add complexity upward.
- Never write a raw pixel value inside a media query — always reference the token.

```scss
// tools/_breakpoints.scss
@use 'sass:map';
@use '../tokens' as t;

@mixin respond-to($bp) {
  @if not map.has-key(t.$breakpoints, $bp) {
    @error 'Unknown breakpoint: #{$bp}. Available: #{map.keys(t.$breakpoints)}';
  }
  @media (min-width: map.get(t.$breakpoints, $bp)) {
    @content;
  }
}
```

### Naming conventions
- Use kebab-case for all variables, classes, and file names.
- Token naming pattern: `$[category]-[variant]-[state]`
  - `$color-text-primary`, `$color-text-disabled`
  - `$space-stack-md`, `$radius-button`
  - `$shadow-card`, `$motion-duration-fast`
- Component class naming: BEM — `.block__element--modifier`.
- Utility class naming: `.u-[property]-[value]` — `.u-mt-4`, `.u-visually-hidden`.

### Avoiding common mistakes
- Never nest more than 3 levels deep. If you need to, the structure is wrong.
- Never use `@extend` across files — it creates unpredictable selector explosion.
- Never define a color or spacing value twice — add a token instead.
- Avoid relying on cascade order for correctness; use explicit specificity instead.
- Do not put media queries inline inside deeply nested selectors — extract to a mixin call.

### Integrating with JavaScript frameworks
- When using CSS Modules (React, Vue), place component SCSS files next to the component (`Button.module.scss`).
- Still import from the shared `tokens/` and `tools/` using relative paths.
- Export token values to JS with `:export { spaceMd: $space-md; }` when needed.
- For Storybook, add the `styles/main.scss` import to `.storybook/preview.js`.

---

## When to add a mixin

- You repeat the same declaration block in two or more files.
- A pattern needs parameters: size, color, breakpoint, or variant.
- A utility-like pattern must stay consistent across components.
- A browser-compatibility block would otherwise be duplicated.

## When to add a function

- You need derived values from tokens (e.g. `space(4)` returns `$space-4`).
- You are building a scale, `clamp()` calculation, or unit conversion.
- You need consistent math that would otherwise be copy-pasted.

## When to add a token

- A value appears in more than one place.
- A value is likely to change across themes or brand variants.
- A value needs a semantic name to be understandable in code review.

---

## Output expectations

When asked to produce SCSS for a system:
- Define tokens first, then tools, then components.
- Show the file structure when the task is architectural.
- Keep examples practical: show `@use` imports, real token references, and mixin calls.
- Explain how a component consumes tokens and mixins rather than hard-coding values.
- Include responsive and dark-mode examples when the task involves layout or color.

---

## References

- [references/tokens.md](references/tokens.md): token layers, scales, naming, and CSS custom property integration
- [references/mixins.md](references/mixins.md): mixin patterns, parameters, and practical examples
- [references/components.md](references/components.md): component styling guidance, BEM, state management
- [references/architecture.md](references/architecture.md): full folder split, dependency rules, and framework build patterns
