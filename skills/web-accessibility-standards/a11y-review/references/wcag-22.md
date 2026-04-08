# WCAG 2.2

Primary source:
- W3C WAI: WCAG 2.2 Recommendation and supporting guidance
- https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- https://www.w3.org/WAI/news/2023-10-05/wcag22rec/

Use WCAG 2.2 as the current review and implementation baseline. Level A criteria are the minimum floor; Level AA is the widely adopted legal and organizational standard.

---

## Quick reference: Level A and AA criteria (by principle)

> **Scope note**: The tables below include all Level A and AA criteria, which form the standard compliance target. A small number of Level AAA criteria that are new in WCAG 2.2 are included in the table for completeness (marked AAA) — they exceed the AA baseline and are aspirational rather than required for standard conformance.

### Principle 1 — Perceivable

| Criterion | Level | Topic |
|---|---|---|
| 1.1.1 Non-text Content | A | All non-text content has a text alternative (alt, aria-label, etc.) |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Provide transcript or audio description |
| 1.2.2 Captions (Prerecorded) | A | Captions for prerecorded audio in video |
| 1.2.3 Audio Description or Media Alternative | A | Audio description or full text alternative |
| 1.2.4 Captions (Live) | AA | Captions for live audio in video |
| 1.2.5 Audio Description (Prerecorded) | AA | Audio description for prerecorded video |
| 1.3.1 Info and Relationships | A | Structure conveyed via semantics (headings, lists, tables, labels) |
| 1.3.2 Meaningful Sequence | A | Reading and navigation order is logical |
| 1.3.3 Sensory Characteristics | A | Instructions do not rely on shape, color, size, visual location, orientation, or sound alone |
| 1.3.4 Orientation | AA | Content is not restricted to a single orientation |
| 1.3.5 Identify Input Purpose | AA | Autocomplete tokens for personal data fields |
| 1.4.1 Use of Color | A | Color is not the only means of conveying information |
| 1.4.2 Audio Control | A | Mechanism to pause/stop/control audio that plays automatically |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 for normal text; 3:1 for large text |
| 1.4.4 Resize Text | AA | Text can be resized to 200% without loss of content or function |
| 1.4.5 Images of Text | AA | Avoid using images of text when live text can be used |
| 1.4.10 Reflow | AA | Content reflows to single column at 320 CSS px wide |
| 1.4.11 Non-text Contrast | AA | 3:1 contrast for UI components and graphical objects |
| 1.4.12 Text Spacing | AA | No loss of content with text spacing overrides |
| 1.4.13 Content on Hover or Focus | AA | Hover/focus-triggered content is dismissible, hoverable, persistent |

### Principle 2 — Operable

| Criterion | Level | Topic |
|---|---|---|
| 2.1.1 Keyboard | A | All functionality available from keyboard |
| 2.1.2 No Keyboard Trap | A | Focus can always be moved away by keyboard |
| 2.1.4 Character Key Shortcuts | A | Single-key shortcuts can be remapped or disabled |
| 2.2.1 Timing Adjustable | A | User can adjust, extend, or disable time limits |
| 2.2.2 Pause, Stop, Hide | A | Auto-updating content can be paused/stopped |
| 2.3.1 Three Flashes or Below Threshold | A | No content flashes more than 3 times per second |
| 2.4.1 Bypass Blocks | A | Mechanism to skip repeated blocks (skip navigation link) |
| 2.4.2 Page Titled | A | Pages and views have descriptive titles |
| 2.4.3 Focus Order | A | Focus order preserves meaning and operability |
| 2.4.4 Link Purpose (In Context) | A | Link text (+ context) describes the destination |
| 2.4.5 Multiple Ways | AA | More than one way to navigate to a page |
| 2.4.6 Headings and Labels | AA | Headings and labels are descriptive |
| 2.4.7 Focus Visible | AA | Keyboard focus indicator is visible |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Focused component is not entirely hidden by sticky content |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | Focused component is fully visible |
| 2.4.13 Focus Appearance | AAA | Focus indicator meets size and contrast requirements |
| 2.5.1 Pointer Gestures | A | Multi-pointer/path gestures have single-pointer alternatives |
| 2.5.2 Pointer Cancellation | A | Actions triggered on up-event, not down-event |
| 2.5.3 Label in Name | A | Visible label text is included in the accessible name |
| 2.5.4 Motion Actuation | A | Functionality triggered by device motion has UI alternative |
| 2.5.7 Dragging Movements | AA | Dragging functionality has a single-pointer alternative |
| 2.5.8 Target Size (Minimum) | AA | Touch targets are at least 24×24 CSS px |

### Principle 3 — Understandable

| Criterion | Level | Topic |
|---|---|---|
| 3.1.1 Language of Page | A | `lang` attribute identifies the default language |
| 3.1.2 Language of Parts | AA | `lang` identifies language changes within content |
| 3.2.1 On Focus | A | Receiving focus does not trigger unexpected context change |
| 3.2.2 On Input | A | Changing a setting does not trigger unexpected context change |
| 3.2.3 Consistent Navigation | AA | Navigation is in the same relative order across pages |
| 3.2.4 Consistent Identification | AA | Components with same function are identified consistently |
| 3.2.6 Consistent Help | A | Help mechanisms appear in the same location across pages |
| 3.3.1 Error Identification | A | Input errors are identified and described in text |
| 3.3.2 Labels or Instructions | A | Labels or instructions are provided for user input |
| 3.3.3 Error Suggestion | AA | Error corrections are suggested when known |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Submissions can be checked, confirmed, or reversed |
| 3.3.7 Redundant Entry | A | Previously entered information is auto-populated or available for selection |
| 3.3.8 Accessible Authentication (Minimum) | AA | Authentication does not require solving a cognitive function test |
| 3.3.9 Accessible Authentication (Enhanced) | AAA | Authentication alternative requires no cognitive test at all |

### Principle 4 — Robust

| Criterion | Level | Topic |
|---|---|---|
| 4.1.2 Name, Role, Value | A | UI components have accessible name, role, and state programmatically exposed |
| 4.1.3 Status Messages | AA | Status messages are programmatically determinable so AT can announce them |

---

## New in WCAG 2.2 (relative to 2.1)

Added:
- 2.4.11 Focus Not Obscured (Minimum) — AA
- 2.4.12 Focus Not Obscured (Enhanced) — AAA
- 2.4.13 Focus Appearance — AAA
- 2.5.7 Dragging Movements — AA
- 2.5.8 Target Size (Minimum) — AA
- 3.2.6 Consistent Help — A
- 3.2.6 Consistent Help — A
- 3.3.7 Redundant Entry — A
- 3.3.8 Accessible Authentication (Minimum) — AA
- 3.3.9 Accessible Authentication (Enhanced) — AAA

Removed (from WCAG 2.1):
- 4.1.1 Parsing — removed because modern browser parsing rules make it redundant

---

## WCAG 3.0 awareness

WCAG 3.0 (formerly "Silver") is in active development and not yet a W3C Recommendation. Do not use WCAG 3.0 as a compliance baseline. Monitor https://www.w3.org/TR/wcag-3.0/ for progress. Key expected changes include: new outcome-based structure, graduated conformance levels, and broader guidance beyond web content.

---

## Review posture

Map issues to specific success criteria when the task is compliance-oriented. For implementation tasks, use criteria as design constraints rather than only as a final checklist. When reporting issues:

- **Failure**: clearly violates a specific WCAG criterion at the stated level — must fix.
- **Best practice**: not a WCAG failure but strongly recommended — should fix.
- **Enhancement**: exceeds AA requirements or improves UX beyond baseline — consider.
