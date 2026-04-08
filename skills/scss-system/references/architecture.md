# Architecture

This reference describes the full folder split, dependency rules, and patterns for building a production SCSS framework or application stylesheet.

---

## Full folder tree

```
styles/
├── tokens/
│   ├── _primitive.scss     # Raw scale values — palette, numeric steps
│   ├── _semantic.scss      # Purpose-named aliases of primitives
│   ├── _typography.scss    # Font families, sizes, weights, line-heights
│   ├── _shadow.scss        # Elevation scale
│   ├── _motion.scss        # Duration, easing, reduced-motion
│   ├── _z-index.scss       # Layering constants
│   └── _index.scss         # @forward all token partials
│
├── tools/
│   ├── _breakpoints.scss   # $breakpoints map + respond-to() mixin
│   ├── _spacing.scss       # stack(), inline-cluster(), padded() mixins
│   ├── _typography.scss    # fluid-type(), truncate(), visually-hidden()
│   ├── _color.scss         # contrast-color(), tint(), shade()
│   ├── _focus.scss         # focus-ring(), focus-visible-ring()
│   ├── _grid.scss          # grid-container(), auto-grid()
│   ├── _theme.scss         # dark() mixin for theme variants
│   ├── _motion.scss        # transition(), reduced-motion() mixin
│   └── _index.scss         # @forward all tools
│
├── base/
│   ├── _reset.scss         # Minimal CSS reset (box-sizing, margins, lists)
│   ├── _root.scss          # :root { --custom-properties }
│   ├── _typography.scss    # body, headings, paragraphs, code
│   └── _index.scss
│
├── layout/
│   ├── _container.scss     # Max-width wrapper with inline padding
│   ├── _grid.scss          # Page-level column grid
│   ├── _stack.scss         # Vertical spacing composition
│   ├── _sidebar.scss       # Two-column with fixed/flexible sidebar
│   └── _index.scss
│
├── components/
│   ├── _button.scss
│   ├── _input.scss
│   ├── _card.scss
│   ├── _modal.scss
│   ├── _nav.scss
│   ├── _tabs.scss
│   ├── _badge.scss
│   ├── _alert.scss
│   ├── _spinner.scss
│   └── _index.scss
│
├── patterns/
│   ├── _hero.scss          # Hero section (heading + cta + image)
│   ├── _feature-grid.scss  # Icon + heading + text grid
│   ├── _form.scss          # Form layout wrapping input components
│   └── _index.scss
│
├── pages/
│   ├── _home.scss
│   ├── _dashboard.scss
│   └── _index.scss
│
├── utilities/
│   ├── _display.scss       # .u-flex, .u-grid, .u-block, .u-hidden
│   ├── _spacing.scss       # .u-mt-{n}, .u-mb-{n}, .u-p-{n}
│   ├── _text.scss          # .u-truncate, .u-visually-hidden, .u-uppercase
│   ├── _color.scss         # .u-text-primary, .u-bg-surface
│   └── _index.scss
│
├── themes/
│   ├── _dark.scss          # Dark color-scheme overrides
│   ├── _high-contrast.scss # Accessibility high-contrast mode
│   └── _index.scss
│
└── main.scss               # Entry point — imports all layers
```

---

## main.scss — entry point and layer order

```scss
// styles/main.scss
// Layer 1: no output, no side effects
@use 'tokens';

// Layer 2: no output, no side effects
@use 'tools';

// Layer 3: global output — always first CSS in bundle
@use 'base';

// Layer 4: structural output
@use 'layout';

// Layer 5: component output
@use 'components';

// Layer 6: pattern output
@use 'patterns';

// Layer 7: page-specific output (optional)
@use 'pages';

// Layer 8: utility output — high specificity, loaded last intentionally
@use 'utilities';

// Layer 9: theme output — overrides custom properties
@use 'themes';
```

---

## Dependency rules

```
tokens   ←  tools   ←  base   ←  layout
                    ←  components
                    ←  patterns  ←  components
                    ←  pages     ←  (any)
                    ←  utilities
                    ←  themes
```

- A lower layer **never** imports from a higher layer.
- `tokens/` has no imports — it is the only file with no `@use`.
- `tools/` imports only from `tokens/`.
- Every other layer imports from `tokens/` and `tools/`, never from sibling layers except as documented above.

---

## _index.scss pattern

Every folder uses an `_index.scss` to aggregate its partials with `@forward`:

```scss
// tokens/_index.scss
@forward 'primitive';
@forward 'semantic';
@forward 'typography';
@forward 'shadow';
@forward 'motion';
@forward 'z-index';
```

This lets consumers use a single short path:
```scss
// In any component file:
@use '../tokens' as t;  // not @use '../tokens/semantic' as t
@use '../tools' as m;
```

---

## Configurable framework pattern

When building a reusable framework (not an app), use `!default` on all tokens and expose a configuration entry point:

```scss
// my-framework/_config.scss
// Consumers override here, then @use 'my-framework' in their main.scss

// my-framework/main.scss
@use 'config';       // user overrides land here first
@use 'tokens' with (
  $color-accent: config.$brand-color,
  $font-family-body: config.$font-stack,
);
@use 'tools';
@use 'base';
@use 'components';
```

Consumer usage:
```scss
// their-app/styles/main.scss
@use 'my-framework/config' with (
  $brand-color: #ff5722,
  $font-stack: 'Inter', sans-serif,
);
@use 'my-framework';
```

---

## Build tooling integration

### Sass CLI
```bash
# Development (expanded + source maps)
sass --watch styles/main.scss:dist/main.css --style=expanded

# Production (compressed, no source maps)
sass styles/main.scss dist/main.css --style=compressed --no-source-map

# Load path for node_modules
sass styles/main.scss dist/main.css --load-path=node_modules
```

### Vite / webpack
```js
// vite.config.js
export default {
  css: {
    preprocessorOptions: {
      scss: {
        // Inject token and tool imports automatically into every file
        additionalData: `
          @use '/styles/tokens' as t;
          @use '/styles/tools' as m;
        `,
      },
    },
  },
};
```

### stylelint configuration
```json
{
  "extends": ["stylelint-config-standard-scss"],
  "rules": {
    "max-nesting-depth": 3,
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?(--[a-z][a-z0-9]*(-[a-z0-9]+)*)?$",
    "scss/no-global-function-names": true,
    "no-descending-specificity": true
  }
}
```

---

## Scaling the system

| Scale | What changes |
|---|---|
| Single page | One `main.scss`, minimal component set |
| Multi-page app | Add `pages/` partials, split bundle per route |
| Component library | Add `_index.scss` at root that exports only `tokens` and `tools`; consumers bring their own base |
| Multi-brand product | Add a `brands/` folder parallel to `themes/`; each brand overrides primitive tokens |
| Design token pipeline | Generate `tokens/_primitive.scss` from a design tool export (Style Dictionary, Theo) |

---

## Checklist for a new project

- [ ] Folder tree created
- [ ] `tokens/_primitive.scss` — raw scale defined
- [ ] `tokens/_semantic.scss` — semantic aliases defined
- [ ] `base/_reset.scss` — minimal reset
- [ ] `base/_root.scss` — CSS custom properties from tokens
- [ ] `tools/_breakpoints.scss` — `respond-to()` mixin
- [ ] `main.scss` — all layers imported in correct order
- [ ] Sass compiles without errors or deprecation warnings
- [ ] stylelint passes with no errors
- [ ] Light and dark theme tokens both defined
- [ ] Color contrast validated (WCAG AA minimum)
