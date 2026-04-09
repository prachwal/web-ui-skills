# Design Token Audit

Patterns for identifying hardcoded values and replacing them with design tokens.

## Hardcoded value detector (SCSS/CSS)

Flag any of the following in component styles:

```scss
// Bad — all of these should use tokens
.card {
  padding: 16px;                    // → var(--space-4) or $space-4
  margin-bottom: 24px;              // → var(--space-6) or $space-6
  font-size: 14px;                  // → var(--text-sm)
  font-weight: 600;                 // → var(--font-semibold)
  line-height: 1.5;                 // → var(--leading-normal)
  color: #1a1a2e;                   // → var(--color-text-primary)
  background-color: #ffffff;        // → var(--color-surface)
  border: 1px solid #e2e8f0;        // → 1px solid var(--color-border)
  border-radius: 8px;               // → var(--radius-md)
  box-shadow: 0 2px 8px #00000029;  // → var(--shadow-md)
  transition: opacity 200ms ease;   // → var(--duration-fast) var(--ease-default)
}

// Good — token-based
.card {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: opacity var(--duration-fast) var(--ease-default);
}
```

## Token category checklist

| Category | Tokens to check | Bad pattern examples |
|---|---|---|
| Spacing | `--space-*`, `$space-*` | `8px`, `16px`, `24px`, `1rem` |
| Typography | `--text-*`, `--font-*`, `--leading-*` | `14px`, `font-size: 1em`, `font-weight: 700` |
| Color | `--color-*` | `#fff`, `#000`, `rgb(...)`, brand hex literals |
| Radius | `--radius-*` | `4px`, `8px`, `50%` (unless truly circular) |
| Shadow | `--shadow-*` | long `box-shadow` literals |
| Animation | `--duration-*`, `--ease-*` | `200ms`, `ease-in-out`, `cubic-bezier(...)` |
| Z-index | `--z-*` | bare integers like `z-index: 100` |

## Regex patterns for automated grep

```bash
# Find hardcoded pixel values in SCSS files (not in comments)
grep -rn --include="*.scss" "[^/]:\s*[0-9]\+px" src/

# Find hardcoded hex colors
grep -rn --include="*.scss" "#[0-9a-fA-F]\{3,6\}" src/

# Find hardcoded rgb/rgba
grep -rn --include="*.scss" "rgba\?(" src/

# Find hardcoded font-size numbers
grep -rn --include="*.scss" "font-size:\s*[0-9]" src/
```

## Token usage verification

When reviewing a specific component, extract computed values in devtools and compare:

```
Expected (from design spec or token file):
  --space-4 = 16px  ← matches
  --color-text-primary = #1a1a2e  ← matches
  --radius-md = 8px  ← MISMATCH: computed 6px (hardcoded in component)
```

## Rules

- Every numeric value in a component stylesheet is a candidate for tokenization.
- Exception: `1px` border widths, `0` resets, and intrinsic sizes (`width: 100%`) do not need tokens.
- If a token does not exist for a value, raise it as a design system gap rather than hardcoding.
- Token violations in a shared design system component are `Major`; in a one-off page section they are `Minor`.
