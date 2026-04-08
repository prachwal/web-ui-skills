# ARIA and APG

Primary source:
- WAI-ARIA Authoring Practices Guide
- https://www.w3.org/WAI/ARIA/apg/
- https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/
- WAI-ARIA 1.2 Specification: https://www.w3.org/TR/wai-aria-1.2/

---

## Core rules

- No ARIA is better than bad ARIA.
- A role is a promise: if you assign a role, implement the expected behavior.
- Native HTML beats ARIA whenever native HTML already provides the semantics and interaction.
- ARIA only changes what the accessibility tree exposes — it does not change visual appearance, DOM behavior, or keyboard handling by itself.

---

## Use ARIA for

- composite widgets that native HTML does not cover well (tabs, trees, comboboxes, menus)
- state and relationship metadata: `aria-expanded`, `aria-pressed`, `aria-selected`, `aria-controls`, `aria-describedby`, `aria-owns`
- landmarks when native sectioning alone is not sufficient
- accessible names on elements that have no visible text: `aria-label`, `aria-labelledby`
- live regions to announce dynamic content changes

---

## Do not use ARIA for

- replacing a native button with `div role="button"` unless you also implement full keyboard support, focus handling, and state management
- masking correct native semantics without a documented reason
- styling or visual hooks unrelated to accessibility semantics
- adding redundant roles that duplicate what the native element already exposes (e.g. `<button role="button">`)

---

## Accessible name computation (priority order)

When a browser calculates the accessible name for an element, it follows this order:

1. `aria-labelledby` — references one or more element IDs; their text content is concatenated
2. `aria-label` — a direct string override
3. Native label association — `<label for="id">`, `<legend>`, `<caption>`, `<th>`, `<figcaption>`, `<alt>` on images
4. `title` attribute — fallback; also shows as tooltip
5. Visible text content of the element itself (for buttons, links, headings)

For descriptions (supplementary to the name): use `aria-describedby` pointing to an element that contains the description text.

---

## Common roles reference

| Role | Use case | Key keyboard behavior |
|---|---|---|
| `button` | Activatable control | Enter and Space activate |
| `link` | Navigation to URL or in-page target | Enter activates |
| `checkbox` | Binary toggle | Space toggles `aria-checked` |
| `radio` | One-of-group selection | Arrow keys move selection within group |
| `combobox` | Text input with a popup list | Down arrow opens popup; Escape closes |
| `listbox` | Static selectable list | Arrow keys navigate; Enter/Space select |
| `menu` | Application menu (not navigation) | Arrow keys navigate; Escape closes |
| `menuitem` | Item in a menu | Enter/Space activate |
| `tab` | Tab list item | Arrow keys move focus between tabs |
| `tabpanel` | Panel associated with a tab | Tab moves into panel content |
| `dialog` | Modal or non-modal overlay | Focus trapped inside (modal); Escape closes |
| `alertdialog` | Modal dialog with urgent message | Immediate focus; Escape or button closes |
| `alert` | `aria-live="assertive"` shorthand | Announces immediately; no keyboard behavior |
| `status` | `aria-live="polite"` shorthand | Announces after current speech finishes |
| `tooltip` | Supplementary popup on hover/focus | Escape dismisses; no activation key |
| `tree` | Hierarchical expandable list | Arrow keys navigate and expand/collapse |
| `grid` | Interactive table | Arrow keys navigate cells |
| `region` | Significant page section | Must have an accessible name |

---

## Common states and properties

| Attribute | Values | Meaning |
|---|---|---|
| `aria-expanded` | `true` / `false` | Controls/discloses content is open or closed |
| `aria-hidden` | `true` / `false` | Removes element from the accessibility tree |
| `aria-disabled` | `true` / `false` | Element is present but not operable |
| `aria-pressed` | `true` / `false` / `mixed` | Toggle button state |
| `aria-checked` | `true` / `false` / `mixed` | Checkbox or option state |
| `aria-selected` | `true` / `false` | Selection state in listbox, tab, option |
| `aria-current` | `page` / `step` / `location` / `true` | Indicates current item in a set |
| `aria-busy` | `true` / `false` | Container is loading/updating |
| `aria-live` | `polite` / `assertive` / `off` | Live region announcement mode |
| `aria-atomic` | `true` / `false` | Whether entire live region is re-read on change |
| `aria-relevant` | `additions` / `removals` / `text` / `all` | What changes trigger live region announcements |
| `aria-controls` | ID(s) | Element controls the referenced element |
| `aria-owns` | ID(s) | Declares ownership of elements not in DOM subtree |
| `aria-haspopup` | `menu` / `listbox` / `tree` / `grid` / `dialog` / `true` | Indicates type of popup |
| `aria-invalid` | `true` / `false` / `grammar` / `spelling` | Field has a validation error |
| `aria-required` | `true` / `false` | Field must be filled before form submission |
| `aria-multiselectable` | `true` / `false` | Multiple items can be selected |
| `aria-readonly` | `true` / `false` | Value cannot be changed by the user |

---

## Live regions

Live regions allow assistive technology to announce dynamic content changes without requiring the user to navigate to the changed element.

**Setup rules:**
- Declare live region containers in the DOM from initial page load — do not inject them dynamically.
- For polite announcements (non-urgent): `aria-live="polite"` or use `role="status"`.
- For assertive announcements (urgent, interrupting): `aria-live="assertive"` or use `role="alert"`.
- Use `aria-atomic="true"` when the entire region should be re-read as a unit (e.g. a count: "3 results found").
- Clear the region text first, then update it in the next frame/tick to ensure the change is detected by all AT.

**Common use cases:**
- Form submission success/error messages
- Search result counts after an async query
- Cart item count updates
- Toast/snackbar notifications
- Step completion in a multi-step wizard

---

## APG usage guidance

When implementing menus, tabs, accordions, dialogs, comboboxes, listboxes, trees, carousels, or similar widgets:
- Check the APG pattern page first: https://www.w3.org/WAI/ARIA/apg/patterns/
- Follow the documented keyboard interaction model exactly.
- Ensure accessible name and description are present on all key elements.
- Test with keyboard and with relevant screen reader + browser combinations.

---

## Mobile and touch caveat

The APG documents keyboard interactions designed for desktop/physical keyboard users. ARIA features are not consistently supported across all mobile browsers and touch interfaces. Treat mobile screen reader support (VoiceOver/iOS, TalkBack/Android) as something to test explicitly — do not assume desktop AT behavior translates directly.
