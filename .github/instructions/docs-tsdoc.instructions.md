---
description: TSDoc rules for exported TypeScript and React symbols.
applyTo: "src/**/*.{ts,tsx}"
---

# TSDoc

- Add TSDoc to exported functions, classes, interfaces, types, enums, and reusable components.
- Keep comments useful and short; describe intent, parameters, return values, and notable side effects.
- Do not document obvious local implementation details.
- Prefer `@param`, `@returns`, `@throws`, and `@example` only when they add signal.
- If a component is route-only and self-explanatory, prioritize readable names over verbose comments.
