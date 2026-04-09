# Handler Testing

Unit-testing handlers with `Request` objects, mock service layer, integration smoke tests with `netlify dev`.

## Unit testing with plain `Request` objects

The Netlify Functions handler is a plain `async (req: Request, context: Context) => Response` function.
Test it directly without spinning up a server.

```ts
// netlify/functions/products.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./products";
import * as productsService from "../../src/services/products";
import * as auth from "../../src/lib/auth";

// Mock the service and auth layers
vi.mock("../../src/services/products");
vi.mock("../../src/lib/auth");

const fakeContext = {
  requestId: "req_test_123",
  params: {},
} as any;

const fakeSession = { userId: "u_1", orgId: "org_1", role: "member" };

function makeRequest(method: string, url: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer test-token" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.mocked(auth.requireAuth).mockResolvedValue(fakeSession);
    vi.mocked(productsService.getProducts).mockResolvedValue([]);
  });

  it("returns 200 with empty list", async () => {
    const req = makeRequest("GET", "https://site.netlify.app/api/products");
    const res = await handler(req, fakeContext);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ data: [] });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.requireAuth).mockResolvedValue(null);
    const req = makeRequest("GET", "https://site.netlify.app/api/products");
    const res = await handler(req, fakeContext);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/products", () => {
  beforeEach(() => {
    vi.mocked(auth.requireAuth).mockResolvedValue(fakeSession);
  });

  it("returns 422 on validation failure", async () => {
    const req = makeRequest("POST", "https://site.netlify.app/api/products", { name: "" });
    const res = await handler(req, fakeContext);
    expect(res.status).toBe(422);
  });

  it("returns 400 on malformed JSON", async () => {
    const req = new Request("https://site.netlify.app/api/products", {
      method: "POST",
      body: "not-json",
      headers: { Authorization: "Bearer test-token" },
    });
    const res = await handler(req, fakeContext);
    expect(res.status).toBe(400);
  });

  it("returns 201 on valid input", async () => {
    vi.mocked(productsService.createProduct).mockResolvedValue({ id: "p_1", name: "Widget" } as any);
    const req = makeRequest("POST", "https://site.netlify.app/api/products", {
      name: "Widget",
      price: 999,
    });
    const res = await handler(req, fakeContext);
    expect(res.status).toBe(201);
  });
});

describe("method guard", () => {
  it("returns 405 for unsupported methods", async () => {
    const req = makeRequest("DELETE", "https://site.netlify.app/api/products");
    const res = await handler(req, fakeContext);
    expect(res.status).toBe(405);
  });
});
```

## vitest.config.ts for Node environment

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",   // handlers run in Node, not browser
    globals: true,
  },
});
```

## Integration smoke test (netlify dev)

Run with `netlify dev` and use a simple curl or fetch script to confirm real behavior:

```bash
# Start local dev server
netlify dev &

# Smoke test: unauthenticated request
curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/api/products
# Expected: 401

# Smoke test: bad JSON body
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:8888/api/products \
  -H "Content-Type: application/json" \
  -d "not-json"
# Expected: 400
```

## Test coverage targets

| Scenario | Test type |
|---|---|
| Happy path (GET list, GET by ID, POST create) | Unit |
| Invalid input / malformed JSON | Unit |
| Unauthorized (no token, expired token) | Unit |
| Forbidden (wrong role or org) | Unit |
| Service/DB failure (mocked throw) | Unit |
| Pagination and filter boundary cases | Unit |
| Real HTTP routing and env loading | Integration (netlify dev) |

## Rules

- Import the handler as a plain function and pass `Request` objects — no HTTP server needed in unit tests.
- Mock at the service boundary, not at the DB driver level, to keep tests fast and focused.
- Test every `if` branch in the handler (method, auth, validation, service error).
- Run at least one `netlify dev` integration pass before merging route changes that depend on platform behavior.
- Confirm `context.requestId` is plumbed through to error responses so logs are traceable.
