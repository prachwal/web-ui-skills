---
name: neon-netlify
description: Use when building Netlify apps or APIs with Neon Postgres. Covers Netlify DB, Neon-powered serverless Postgres, branching workflows, pooled connections, query safety, and operational patterns for Netlify Functions.
---

# Neon Netlify Skill

Use this skill when a Netlify app uses Neon directly or through Netlify DB, which Netlify documents as a Postgres integration powered by Neon.

## Core goals

- Use Neon as a serverless Postgres backend without creating avoidable connection storms.
- Choose the right connection style for Netlify Functions.
- Keep migrations, branches, and preview environments aligned with the deployment workflow.
- Preserve normal Postgres discipline: typed queries, bounded reads, indexed filters, and safe role management.

## Platform facts

- Netlify DB is a Netlify-managed Postgres integration powered by Neon.
- Neon supports serverless Postgres workflows with branches, multiple databases per branch, and managed compute endpoints.
- Neon exposes connection URIs and project management through its API.

## Recommended stack

- Use plain SQL or a query builder for thin APIs.
- Use Prisma, Drizzle, Kysely, or a similar typed layer only if the repo already uses one or clearly benefits from it.
- Use the pooled Neon connection string for Netlify Functions unless the project has a proven reason to use a direct connection.

## Netlify-specific guidance

- Put the Neon connection string in a Netlify runtime env var with Functions scope.
- Reuse database clients at module scope when the library supports it.
- Keep the Netlify function region close to the Neon compute region.
- Use Background Functions for slow maintenance jobs, bulk imports, or heavy migrations instead of synchronous request handlers.

## Branching workflow

- Use Neon branches for preview data or isolated testing environments.
- Do not run destructive schema changes directly against production without a migration plan.
- Treat branch creation, seeding, and cleanup as part of the deployment workflow if previews depend on branch-specific data.
- Keep production credentials separate from preview and development credentials.

## Query rules

- Parameterize every query.
- Add indexes for frequent filters, joins, and ordering columns.
- Keep page sizes bounded.
- Prefer one shaped query over multiple request-path round trips.
- Run `EXPLAIN` or Neon query tuning before guessing at fixes.

## Connection pattern

```ts
// netlify/functions/_lib/db.ts
import { neon } from "@neondatabase/serverless";

const connectionString = Netlify.env.get("DATABASE_URL");
if (!connectionString) throw new Error("DATABASE_URL is not set");

// neon() returns a tagged template SQL executor; reuse it across warm invocations.
export const sql = neon(connectionString);
```

Usage:

```ts
const rows = await sql`SELECT id, name FROM products WHERE active = true LIMIT ${limit}`;
```

Use the pooled connection string for Netlify Functions. Use the direct connection string only for migration tooling run outside of the function runtime.

## Roles and secrets

- Use least-privilege Postgres roles.
- Avoid shared superuser credentials in app code.
- Rotate credentials through Netlify env vars and redeploy after changes.
- Keep admin or migration credentials out of user-facing function code.

## Netlify DB guidance

- Use Netlify DB when you want the fastest Netlify-native setup flow for a Postgres database.
- Treat it as Neon operationally: region, connection management, SQL discipline, and migration safety still matter.
- Verify which environment variables Netlify injects before hardcoding names into shared templates.

## Testing focus

- Missing or wrong Neon connection strings.
- Branch-specific preview workflows.
- Migrations under load and rollback safety.
- Query latency from function region to Neon region.
- Pooled vs direct connection behavior under concurrent requests.

## References

- [Netlify DB](https://docs.netlify.com/build/data-and-storage/netlify-db/)
- [Neon API: create project](https://api-docs.neon.tech/reference/createproject)
- [Neon API: create compute endpoint](https://api-docs.neon.tech/reference/createprojectendpoint)
- [Neon API: retrieve connection URI](https://api-docs.neon.tech/reference/getconnectionuri)
- [Neon API: create database](https://api-docs.neon.tech/reference/createprojectbranchdatabase)
