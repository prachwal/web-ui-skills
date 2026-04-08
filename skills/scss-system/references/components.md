# Components

Component partials define reusable UI blocks. Each file is responsible for one component only. Components consume tokens and tools but never define raw values.

---

## Component file anatomy

```scss
// components/_button.scss
@use '../tokens' as t;
@use '../tools' as m;

// 1. Root block
.button {
  display: inline-flex;
  align-items: center;
  gap: t.$space-2;
  padding: t.$space-2 t.$space-4;
  font-family: t.$font-family-body;
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-medium;
  line-height: t.$line-height-tight;
  color: t.$color-text-on-accent;
  background-color: t.$color-accent;
  border: none;
  border-radius: t.$radius-button;
  cursor: pointer;
  @include m.transition(background-color);
  @include m.focus-visible-ring;

  // 2. States
  &:hover  { background-color: t.$color-accent-hover; }
  &:active { background-color: t.$color-accent-active; }

  // 3. Modifiers
  &--secondary {
    color: t.$color-accent;
    background-color: transparent;
    border: 1px solid t.$color-accent;
    &:hover { background-color: t.$color-surface-muted; }
  }

  &--ghost {
    color: t.$color-text-primary;
    background-color: transparent;
    border: none;
    &:hover { background-color: t.$color-surface-muted; }
  }

  &--sm { padding: t.$space-1 t.$space-2; font-size: t.$font-size-sm; }
  &--lg { padding: t.$space-4 t.$space-8; font-size: t.$font-size-lg; }

  // 4. Disabled state
  &:disabled,
  &[aria-disabled="true"] {
    color: t.$color-text-disabled;
    background-color: t.$color-surface-muted;
    cursor: not-allowed;
    pointer-events: none;
  }

  // 5. Responsive adjustments (if needed)
  @include m.respond-to(md) {
    font-size: t.$font-size-base;
  }
}
```

---

## BEM naming

- **Block**: `.component-name` — the root element.
- **Element**: `.component-name__element` — a part of the block.
- **Modifier**: `.component-name--modifier` — a variant or state.

```scss
.card { /* block */ }
.card__header { /* element */ }
.card__body   { /* element */ }
.card__footer { /* element */ }
.card--featured { /* modifier */ }
.card--compact  { /* modifier */ }
```

---

## State management

Use both CSS pseudo-classes and ARIA attributes for states:

```scss
// Interactive states
&:hover  { … }
&:focus-visible { … }
&:active { … }

// ARIA-driven states (accessibility)
&[aria-expanded="true"]  { … }
&[aria-disabled="true"]  { … }
&[aria-selected="true"]  { … }
&[aria-current="page"]   { … }

// Data attribute states (JS-driven)
&[data-loading="true"]   { … }
&[data-error="true"]     { … }
```

---

## Good component targets

### Basic controls
- `_button.scss` — primary, secondary, ghost, icon, loading
- `_input.scss` — text, number, search, password, with error/success states
- `_checkbox.scss` / `_radio.scss` — custom styled with accessible focus
- `_select.scss` — custom dropdown trigger
- `_toggle.scss` — switch input

### Containers
- `_card.scss` — surface with header, body, footer, image
- `_modal.scss` — overlay dialog with backdrop
- `_drawer.scss` — side panel
- `_tooltip.scss` — floating hint
- `_popover.scss` — anchored overlay

### Navigation
- `_nav.scss` — horizontal and vertical nav with active states
- `_breadcrumb.scss`
- `_tabs.scss` — tab bar with active indicator
- `_pagination.scss`

### Feedback
- `_alert.scss` — info, success, warning, error variants
- `_badge.scss` — count and status indicators
- `_spinner.scss` — loading indicator
- `_toast.scss` — transient notification

### Data
- `_table.scss` — responsive table with striped/hover rows
- `_list.scss` — ordered, unordered, definition lists

---

## Rules

- Import only `tokens` and `tools` — never import another component.
- Do not define raw colors, spacing, or size values inline — add a token.
- Never nest beyond 3 levels. Flatten with BEM modifiers instead.
- Expose state via classes, `[aria-*]` attributes, and pseudo-classes — not inline styles.
- A component file should not exceed ~150 lines. If it does, split into sub-partials.
- Keep responsive adjustments inside the component file, not in a layout file.
- Provide both `:focus` and `:focus-visible` handling via the `focus-visible-ring` mixin.

---

## Component consumption example

```scss
// How a page or pattern file uses a component:
// pages/_landing.scss
@use '../tokens' as t;
@use '../tools' as m;
// No need to import _button.scss — it is compiled via main.scss

.hero {
  @include m.grid-container;
  padding-block: t.$space-section;

  &__cta {
    // Compose BEM modifiers directly in markup:
    // <button class="button button--lg">Get started</button>
  }
}
```
