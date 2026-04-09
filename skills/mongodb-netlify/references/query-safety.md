# MongoDB Query Safety

Injection prevention, operator allowlisting, safe update patterns, and aggregation safety for MongoDB.

## Injection prevention — never use raw user input as operators

MongoDB query injection occurs when user-controlled input is used as query object keys, allowing `$where`, `$gt`, or `$regex` operators to be injected.

```ts
// Bad — user input as a query object key
const filter = req.body; // { "password": { "$gt": "" } }
await users.findOne(filter); // matches ALL users where password > ""  ← injection

// Still bad — spreading user params into query
const { email, ...rest } = req.body;
await users.findOne({ email, ...rest }); // rest may contain operators

// Good — only use known fields, never spread user input into query
const email = z.string().email().parse(req.body.email);
await users.findOne({ email }); // only the validated value, no operators
```

## Field allowlisting for sort and filter

```ts
// Never use user-provided field names directly in queries or sort
// Bad:
const sort = { [req.query.sortField]: req.query.sortOrder === "asc" ? 1 : -1 }; // ← injection risk

// Good — allowlist the field names
const ALLOWED_SORT_FIELDS = new Set(["name", "price", "createdAt"] as const);
type SortField = "name" | "price" | "createdAt";

function parseSortField(input: unknown): SortField {
  if (typeof input === "string" && ALLOWED_SORT_FIELDS.has(input as SortField)) {
    return input as SortField;
  }
  return "createdAt"; // safe default
}

const sortField = parseSortField(req.query.sortField);
const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
const products = await collection.find({}).sort({ [sortField]: sortOrder }).toArray();
```

## Safe update patterns

```ts
// Bad — replace the whole document if req.body has top-level keys
await collection.replaceOne({ _id }, req.body); // overwrites entire document

// Bad — unvalidated $set allows arbitrary field injection
await collection.updateOne({ _id }, { $set: req.body });

// Good — validate the update payload; only set known fields
const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().positive().optional(),
  active: z.boolean().optional(),
});

const updates = updateSchema.parse(req.body);
if (Object.keys(updates).length === 0) {
  return apiError(400, "No valid fields to update");
}

await collection.updateOne(
  { _id },
  { $set: { ...updates, updatedAt: new Date() } },
);
```

## Projection — exclude sensitive fields

```ts
// Always project to exclude fields the client should not see
const user = await users.findOne(
  { _id: userId },
  {
    projection: {
      _id: 1, name: 1, email: 1, createdAt: 1,
      // Exclude these — they must not appear in API responses
      passwordHash: 0,
      twoFactorSecret: 0,
      adminOverrides: 0,
    },
  }
);
```

## Aggregation safety

```ts
// In aggregation pipelines, validate any user-influenced stage values
const categoryId = z.string().regex(/^[a-z0-9_-]+$/).parse(req.query.categoryId);

const results = await products.aggregate([
  { $match: { categoryId, active: true } },     // validated input
  { $sort: { createdAt: -1 } },
  { $limit: 20 },
  {
    $project: {
      name: 1, price: 1, slug: 1,
      _id: 0,  // omit _id if client does not need it
    },
  },
]).toArray();
```

> Never pass a user-constructed `$match` or `$group` stage directly into an aggregate pipeline.

## ObjectId validation

```ts
import { ObjectId } from "mongodb";

function toObjectId(id: unknown): ObjectId {
  if (typeof id !== "string" || !ObjectId.isValid(id)) {
    throw Object.assign(new Error("Invalid ObjectId"), { status: 400 });
  }
  return new ObjectId(id);
}
```

## Rules

- Never use user input as MongoDB query object keys — validate each field separately.
- Allowlist sort columns and filter fields — never pass a field name from user input directly.
- Validate and reconstruct update payloads — never `$set: req.body`.
- Always project to exclude sensitive fields in `findOne` and aggregation `$project`.
- Parse `ObjectId` values before use — `ObjectId.isValid()` first, then `new ObjectId()`.
- Treat a validation or parse failure as a client error (400/404), not a server error (500).
