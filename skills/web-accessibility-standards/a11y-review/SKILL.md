---
name: a11y-review
description: Use when reviewing web interfaces for accessibility, including WCAG 2.2 mapping, ARIA misuse, keyboard access, focus management, responsive/mobile behavior, and QA findings.
---

# A11y Review Skill

Use this skill for accessibility reviews, QA passes, and compliance-oriented UI checks.

## Review focus

1. Check semantic HTML first.
2. Verify WCAG 2.2 impacts and map findings to specific success criteria.
3. Review keyboard access, focus visibility, and focus order.
4. Review responsive behavior at mobile widths and zoom/reflow states.
5. Review ARIA only after native semantics have been assessed.
6. Distinguish failures from best-practice issues and enhancements.

## Workflow

1. Identify the page or component role.
2. Review structure and semantics.
3. Review keyboard and focus behavior.
4. Review names, descriptions, and announcements.
5. Review responsive and mobile behavior.
6. Review ARIA usage for correctness and necessity.
7. Review motion, contrast, and text scaling.
8. Summarize findings by severity and standard.

## What to flag

- missing or misleading labels
- non-semantic interactive elements
- inaccessible keyboard flows
- hidden focus or focus traps
- poor reflow or mobile behavior
- misuse of ARIA where native HTML would work
- insufficient contrast, touch size, or motion handling

## Reporting style

- `Failure`: clear WCAG violation
- `Best practice`: not a failure, but should be fixed
- `Enhancement`: useful improvement beyond baseline

## References

- [references/wcag-22.md](references/wcag-22.md)
- [references/aria-apg.md](references/aria-apg.md)
- [references/responsive-mobile-first.md](references/responsive-mobile-first.md)
- [references/review-checklist.md](references/review-checklist.md)
