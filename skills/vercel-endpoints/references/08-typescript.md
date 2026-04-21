# TypeScript notes for mixed client + function projects

- Use `tsconfig.json` in strict mode and include `types: ["vite/client", "vitest/globals"]` when using Vite and Vitest.
- Keep `paths` alias `@/*` mapped to `./src/*`; avoid `baseUrl` if it creates ambiguity with newer TypeScript versions.
- Use `tsc -p tsconfig.json --noEmit` for type checking in CI.
- Build output and module resolution:
  - Ensure your bundler's output (`dist`) matches runtime expectations for functions (ESM vs CommonJS, emitted `.js` file names).
  - For serverless functions, confirm that any runtime imports resolve to emitted artifacts — adjust import specifiers if necessary.
