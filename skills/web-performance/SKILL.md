---
name: web-performance
description: Use when improving web app performance, Core Web Vitals, loading speed, rendering, asset delivery, code splitting, caching, and image optimization.
---

# Web Performance Skill

Use this skill when a task is about making a web app faster, lighter, or more stable under real-world network and device constraints.

## Core principles

1. Measure first, then optimize the biggest bottleneck.
2. Treat Core Web Vitals as the baseline: LCP, INP, CLS.
3. Reduce transferred bytes before micro-optimizing code.
4. Minimize main-thread work and avoid unnecessary re-renders.
5. Prevent layout shifts, especially from images, fonts, and async content.
6. Validate on mobile-sized screens and slower network/device profiles.

## Workflow

1. Identify the slow path: initial load, interaction latency, scrolling, or post-load updates.
2. Decide the target metric: LCP, INP, CLS, or bundle size / TTI proxy.
3. Fix the largest cause first: large assets, blocking scripts, expensive rendering, or layout shifts.
4. Prefer code splitting, lazy loading, and caching over premature low-level tweaks.
5. Validate the change with a performance trace or lab tool, then re-check the user-visible flow.
6. Keep the optimization maintainable; do not introduce a brittle fast path.

## Practical rules

- Ship smaller JS and CSS bundles.
- Load only what the current view needs.
- Use responsive images and the correct file format.
- Reserve space for images, embeds, and late-loading UI.
- Avoid synchronous work during startup and route changes.
- Prefer server-friendly or cached work for repeated expensive computation.
- Do not trade accessibility or correctness for speed.

## References

- [references/core-web-vitals.md](references/core-web-vitals.md)
- [references/images.md](references/images.md)
- [references/responsive-loading.md](references/responsive-loading.md)
