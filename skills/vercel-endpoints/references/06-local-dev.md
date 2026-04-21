# Local development and `vercel dev`

Use `vercel dev` to emulate Vercel routes, rewrites and functions locally. It is the fastest way to validate routing and function wiring.

Differences to watch for:

- `vercel dev` and your production environment may differ in subtle build outputs and asset serving; always verify a production preview when unsure.
- Bun runtime behavior may differ across versions — pin `bunVersion` in `vercel.json` and test a real deploy when runtime-specific features are used.

Recommended workflow:

1. Run `pnpm install` (or `bun install`) and `pnpm dev`/`bun run dev` for the SPA.
2. Run `vercel dev` to exercise serverless functions and rewrites together.
3. When function behavior differs in prod, deploy a preview and check Vercel logs (Build/Functions logs) to diagnose.
