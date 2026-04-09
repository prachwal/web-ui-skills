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
- Use `netlify-serverless` for function-type choice and `netlify-database-security` for general secret policy.

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

## Reference files

### [`references/connection.md`](references/connection.md)
**Neon connection setup** — Module-scope `neon()` SQL executor with `requireEnv()` fail-fast, tagged-template parameterized query examples, pooled vs. direct connection string table (with format and when to use each), transaction pattern using `pg.Pool` + direct string, rules for module-scope initialization and SSL.

### [`references/branching.md`](references/branching.md)
**Preview branch workflow** — What a Neon branch is (copy-on-write, instant creation), Neon API `POST /branches` call with endpoint creation, GitHub Actions CI step for branch-per-PR, seeding with migration tooling, branch cleanup script on PR close (list by name → delete by ID), rules for credential separation and lifecycle management.

### [`references/query-patterns.md`](references/query-patterns.md)
**Safe queries and optimization** — Tagged-template driver injection safety, bounded pagination with `Math.min` cap and parallel `COUNT` query, `EXPLAIN ANALYZE` output interpretation table, index recommendation patterns (single, compound, partial, GIN full-text), `INSERT … ON CONFLICT DO UPDATE` upsert, rules for EXPLAIN-first optimization.

## External references

- [Netlify DB](https://docs.netlify.com/build/data-and-storage/netlify-db/)
- [Neon API: create project](https://api-docs.neon.tech/reference/createproject)
- [Neon API: create compute endpoint](https://api-docs.neon.tech/reference/createprojectendpoint)
- [Neon API: retrieve connection URI](https://api-docs.neon.tech/reference/getconnectionuri)
- [Neon API: create database](https://api-docs.neon.tech/reference/createprojectbranchdatabase)
