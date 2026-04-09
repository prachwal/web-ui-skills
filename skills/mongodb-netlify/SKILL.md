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

## Connection pattern

```ts
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = Netlify.env.get("MONGODB_URI");
if (!uri) throw new Error("MONGODB_URI is not set");

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 0,
  maxConnecting: 2,
  serverSelectionTimeoutMS: 5000,
});

export async function getDb() {
  return client.db("app");
}
```

## Query and update rules

- Never pass raw request payloads directly into query operators.
- Whitelist sortable fields, filter fields, and projection fields.
- Use indexes for every frequent filter and sort path.
- Set explicit limits on collection reads and pagination size.
- Prefer targeted updates over read-modify-write flows when possible.

## Operational rules

- Keep one client per process, not one client per request.
- Review `maxPoolSize`, `maxConnecting`, and timeout settings for burst traffic.
- Remember that the driver uses polling monitoring mode in function-as-a-service environments.
- Log request IDs and query latency, but never log credentials or full sensitive documents.

## When to use Mongoose

- Use Mongoose only if the project benefits from schemas, middleware, or plugin-heavy domain modeling.
- Avoid adding Mongoose for thin APIs where the native driver is enough.
- If Mongoose is already in the repo, centralize connection reuse and keep models out of request handlers.

## Testing focus

- Wrong or missing Mongo URI.
- Query validation failures and malformed ObjectId input.
- Slow query and timeout behavior.
- Pool exhaustion or burst traffic assumptions.
- Atlas connectivity from local `netlify dev` and deployed functions.

## References

- [MongoDB Node.js driver: choose a connection target](https://www.mongodb.com/docs/drivers/node/current/connect/connection-targets/)
- [MongoDB Node.js driver: connection options](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connection-options/)
- [MongoDB Node.js driver: connection pools](https://www.mongodb.com/docs/drivers/node/v6.x/connect/connection-options/connection-pools/)
- [Netlify environment variables and functions](https://docs.netlify.com/functions/environment-variables/)
