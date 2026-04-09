---
name: mongodb-netlify
description: Use when building Netlify Functions or full-stack apps that use MongoDB Atlas or MongoDB-compatible deployments. Covers connection reuse, pool settings, Stable API, query safety, and serverless operational patterns.
---

# MongoDB Netlify Skill

Use this skill when a Netlify app or API uses MongoDB, especially MongoDB Atlas with the Node.js driver inside Netlify Functions.

## Core goals

- Reuse `MongoClient` instances safely across warm invocations.
- Keep connection counts predictable in serverless workloads.
- Validate all input before it reaches MongoDB queries or updates.
- Keep reads and writes explicit, typed, and bounded.

## Recommended stack

- Use the official `mongodb` Node.js driver unless the project already standardizes on an ODM such as Mongoose.
- Prefer MongoDB Atlas for hosted deployments.
- Use the Stable API options when connecting to Atlas to reduce breakage when Atlas upgrades server versions.

## Netlify-specific guidance

- Create the `MongoClient` once at module scope and reuse it across warm invocations.
- Keep pool sizes intentionally small for public APIs that may scale horizontally.
- Store the URI in a Netlify runtime environment variable with Functions scope.
- Align Atlas region and Netlify function region when latency matters.
- Use `netlify-serverless` for execution-model choices and `netlify-database-security` for generic secret policy.

## Reference files

### [`references/connection.md`](references/connection.md)
**MongoClient setup and pool sizing** — Module-scope `MongoClient` with Stable API options (`strict: true`, `deprecationErrors: true`), `requireEnv()` fail-fast pattern, pool sizing table for serverless (low-traffic / moderate / burst / background), typed collection access with `WithId<T>`, `ObjectId` parse error handling, rules for idempotent `connect()` calls.

### [`references/query-safety.md`](references/query-safety.md)
**Injection prevention and safe queries** — MongoDB operator injection example (raw body as filter → bypass), field allowlisting for sort/filter with `Set` + type narrowing, safe `updateOne` via validated schema (never `$set: req.body`), projection to exclude sensitive fields, aggregation pipeline safety, `ObjectId.isValid()` guard, rules.

## External references

- [MongoDB Node.js driver: choose a connection target](https://www.mongodb.com/docs/drivers/node/current/connect/connection-targets/)
- [MongoDB Node.js driver: connection options](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connection-options/)
- [MongoDB Node.js driver: connection pools](https://www.mongodb.com/docs/drivers/node/v6.x/connect/connection-options/connection-pools/)
- [Netlify environment variables and functions](https://docs.netlify.com/functions/environment-variables/)
