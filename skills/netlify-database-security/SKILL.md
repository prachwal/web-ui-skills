---
name: netlify-database-security
description: Use when connecting Netlify backend APIs to databases and you need secure runtime env handling, least privilege, safe data access patterns, and storage choices that fit Netlify's platform constraints.
---

# Netlify Database Security Skill

Use this skill when an API reads or writes persistent data from a database.

## Security goals

- Minimize credential exposure.
- Reduce blast radius with least privilege.
- Prevent injection, privilege escalation, and accidental data leaks.
- Keep data access predictable and auditable.

## Storage selection

- Use Netlify Blobs only for simple key-value or unstructured data with frequent reads and infrequent writes.
- Do not model relational data, complex querying, or concurrency-sensitive workflows on top of Blobs. Netlify explicitly points more advanced cases toward database integrations.
- Treat Blobs as last-write-wins storage. If concurrent writes matter, add your own locking or choose a real database.

## Rules

- Load secrets only from runtime environment variables scoped to Functions.
- Never hardcode credentials, URLs, or tokens.
- Use parameterized queries or a safe query builder.
- Validate and sanitize all external input before persistence.
- Restrict database users to the minimum required permissions.
- Separate read and write paths when that reduces risk.
- Do not assume values declared in `netlify.toml` are available at function runtime. Netlify documents that they are not.

## Connection guidance

- Reuse connections when the runtime allows it.
- Prefer pooling or managed connection proxies where appropriate.
- Treat cold starts as normal and make initialization idempotent.
- Fail closed if a required secret or DSN is missing.
- Keep region placement in mind. If the database is far from the function region, latency and timeout risk increase.

## Data handling guidance

- Store only data the product actually needs.
- Redact secrets, access tokens, and sensitive identifiers from logs.
- Return only the fields required by the client.
- Add explicit limits for pagination, payload size, and query filters.
- Use migrations for schema changes instead of manual edits.
- Never expose arbitrary key access if you store sensitive data in Netlify Blobs.

## Blobs-specific security facts

- Blobs are encrypted at rest and in transit, but application code still controls whether data can leak.
- Site-wide Blobs are accessible through your own site code; keep key naming and access rules private.
- Eventual consistency is the default model. New objects become globally available immediately, while updates and deletes are documented to propagate within 60 seconds.
- Local `netlify dev` uses a sandboxed local Blob store, not production data.

## Operational checklist

- Verify secrets are present in Netlify environment configuration.
- Verify the env var scope includes Functions for runtime access.
- Confirm the DB user cannot access unrelated schemas or admin functions.
- Check that logs do not include raw queries with secrets or personal data.
- Review read/write patterns for N+1 queries and unnecessary round trips.
- Test failure modes for expired credentials, network errors, and timeouts.
- Test secret rotation and redeploy flow because runtime env changes require a new build and deploy.

## References

- [Environment variables and functions](https://docs.netlify.com/functions/environment-variables/)
- [Netlify Blobs overview](https://docs.netlify.com/storage/blobs/overview/)
