---
description: Shared TypeScript type conventions.
applyTo: "src/types/**/*.ts"
---

# Shared Types

- Store cross-cutting contracts in `src/types`.
- Use descriptive domain names and avoid `any`.
- Prefer `unknown` with explicit narrowing when input is not trusted.
- Keep type files focused on one domain concept when practical.
- Document exported shared contracts with short TSDoc.
