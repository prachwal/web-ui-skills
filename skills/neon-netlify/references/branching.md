# Neon Branching Workflow

Creating, using, and cleaning up Neon branches for preview deployments and isolated testing.

## What a Neon branch is

- A Neon branch is a copy-on-write clone of the database at a point in time.
- Creating a branch is instant — no data is copied until the branch writes diverge from the parent.
- Each branch has its own compute endpoint and its own connection string.
- Use branches for: preview deploy databases, CI test isolation, schema migration staging.

## Creating a branch for a preview deploy (Neon API)

```ts
// scripts/create-preview-branch.ts
// Call this from a CI step before deploying a preview environment

const NEON_API_KEY = process.env.NEON_API_KEY!;
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID!;
const branchName = process.env.BRANCH_NAME ?? "preview"; // e.g. "pr-42"

async function createPreviewBranch(parentId: string | undefined) {
  const res = await fetch(`https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NEON_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      branch: { name: branchName, parent_id: parentId },
      endpoints: [{ type: "read_write" }],
    }),
  });

  if (!res.ok) throw new Error(`Neon API error: ${res.status} ${await res.text()}`);
  const data = await res.json();

  const endpoint = data.endpoints[0];
  const host = endpoint.host;
  const connectionString = `postgres://user:password@${host}/neondb?sslmode=require`;
  console.log(`DATABASE_URL=${connectionString}`);
  return connectionString;
}
```

## GitHub Actions CI step — branch per PR

```yaml
# .github/workflows/preview.yml (relevant step)
- name: Create Neon preview branch
  id: neon-branch
  run: |
    node scripts/create-preview-branch.ts
  env:
    NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
    NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
    BRANCH_NAME: pr-${{ github.event.pull_request.number }}

- name: Deploy preview to Netlify
  uses: netlify/actions/deploy@v1
  with:
    publish-dir: dist
  env:
    DATABASE_URL: ${{ steps.neon-branch.outputs.DATABASE_URL }}
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Seeding a preview branch

```bash
# After creating the branch, run migrations against the branch URL
DATABASE_URL="postgres://...branch-url..." npx drizzle-kit migrate

# Then seed test data
DATABASE_URL="postgres://...branch-url..." node scripts/seed-preview.ts
```

## Cleaning up stale preview branches

```ts
// scripts/delete-preview-branch.ts — run on PR close / merge
async function deletePreviewBranch(branchName: string) {
  // 1. List branches to find the ID by name
  const listRes = await fetch(`https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`, {
    headers: { Authorization: `Bearer ${NEON_API_KEY}` },
  });
  const { branches } = await listRes.json();
  const branch = branches.find((b: { name: string }) => b.name === branchName);
  if (!branch) return; // already deleted or never created

  // 2. Delete the branch
  await fetch(`https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branch.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${NEON_API_KEY}` },
  });
}
```

## Rules

- Keep production and preview credentials entirely separate — never reuse the production `DATABASE_URL` for preview branches.
- Create the branch as part of the CI/CD pipeline, not manually.
- Always clean up branches on PR close to avoid unbounded Neon compute cost.
- Run migrations against the branch before seeding and before deploying the preview.
- Store `NEON_API_KEY` and `NEON_PROJECT_ID` as CI secrets, not in source code.
