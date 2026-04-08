# Layout

## Page regions

Build pages from top-level semantic regions first:

```
<header>    — site branding, primary nav
<nav>       — navigation landmark (use aria-label if multiple)
<main>      — primary content (one per page)
<aside>     — secondary/sidebar content
<footer>    — legal, links, contact
```

## MVVM layout structure

```
routes/
  HomePage.tsx           ← thin route shell, composes feature Views
features/
  hero/
    HeroView.tsx         ← View: renders only
    useHeroViewModel.ts  ← ViewModel: signals + actions
  dashboard/
    DashboardView.tsx
    useDashboardViewModel.ts
components/
  layout/
    AppShell.tsx         ← header + nav + main slot
    PageContainer.tsx    ← max-width, padding, grid wrapper
    Sidebar.tsx
```

## Composition rules

- Define container widths, grids, and spacing via SCSS tokens — never inline.
- Use CSS Grid for two-dimensional layouts; Flexbox for one-dimensional rows/columns.
- Keep responsive breakpoints in SCSS; expose them through utility classes or mixins.
- Avoid deeply nested layout wrappers — flatten when possible.
- Use `<Fragment>` to group siblings without adding DOM nodes.

## Responsive layout

- Design mobile-first: base styles are small-screen, breakpoints add complexity.
- Use relative units (`rem`, `%`, `vw`) over fixed `px` for fluid layouts.
- Test layout at 320 px, 768 px, 1024 px, and 1440 px viewports.

