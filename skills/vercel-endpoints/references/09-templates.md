# Templates and starter layout

Minimal working layout for Bun + TypeScript + Vercel Functions:

```text
my-app/
├── api/                      # serverless functions
│   ├── hello.ts
│   └── users/[id].ts
├── src/                      # SPA source (Vite + React)
│   ├── main.tsx
│   └── index.html
├── dist/                     # build output
├── package.json
├── tsconfig.json
└── vercel.json
```

Starter files to include:

- `api/hello.ts` example handler
- `src/main.tsx`, `src/App.tsx`, `src/pages/HomePage.tsx`
- `vite.config.ts` with `@` alias and `@tailwindcss/vite` plugin
- `src/index.css` / `src/styles/main.css` importing Tailwind v4
