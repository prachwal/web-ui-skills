# Serverless security

## Input validation

Validate every field before use. Reject requests that fail validation with `422`.

```ts
function assertString(val: unknown, field: string, maxLen = 500): string {
  if (typeof val !== 'string' || val.trim().length === 0)
    throw new ValidationError(`${field} is required`);
  if (val.length > maxLen)
    throw new ValidationError(`${field} exceeds max length`);
  return val.trim();
}

function assertPositiveInt(val: unknown, field: string): number {
  const n = Number(val);
  if (!Number.isInteger(n) || n < 1)
    throw new ValidationError(`${field} must be a positive integer`);
  return n;
}

class ValidationError extends Error {}
```

## JWT authentication

```ts
import { verify, sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: object, expiresIn = '1h') {
  return sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): { sub: string; role: string } | null {
  try {
    return verify(token, JWT_SECRET) as { sub: string; role: string };
  } catch {
    return null;
  }
}

// In handler:
const auth = event.headers.authorization ?? '';
const user = auth.startsWith('Bearer ') ? verifyToken(auth.slice(7)) : null;
if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
```

## CORS — production-safe

```ts
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim());

function corsHeaders(event: HandlerEvent): Record<string, string> {
  const origin = event.headers.origin ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Vary': 'Origin',
  };
}
```

Set `ALLOWED_ORIGINS=https://app.example.com` in Netlify env, never `*` with credentials.

## Webhook signature verification

Always verify HMAC signatures for webhooks from third-party services:

```ts
import { createHmac, timingSafeEqual } from 'crypto';

function verifyStripeWebhook(body: string, signature: string, secret: string): boolean {
  const parts = Object.fromEntries(signature.split(',').map(p => p.split('=')));
  const timestamp = parts['t'];
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  const received = Buffer.from(parts['v1'] ?? '', 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (received.length !== expectedBuf.length) return false;
  return timingSafeEqual(received, expectedBuf);
}
```

Use `timingSafeEqual` to prevent timing attacks.

## Rate limiting

Use Netlify rate limiting rules in `netlify.toml`:

```toml
[[rateLimit]]
  from  = "/api/*"
  rate  = 100          # requests
  per   = "minute"
  burst = 20

[[rateLimit]]
  from  = "/api/auth/*"
  rate  = 10
  per   = "minute"
```

For in-function token buckets (e.g. per-user), use an external KV store (Netlify Blobs, Upstash Redis).

## Secrets management

```ts
// Fail fast at boot if required secrets are missing
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL', 'STRIPE_WEBHOOK_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```

- Set secrets with `netlify env:set KEY VALUE --scope functions`.
- Never log secret values — log only key names for debugging.
- Rotate secrets via Netlify UI; redeploy to pick up new values.

## Content security

- Set `X-Content-Type-Options: nosniff` on every response.
- Set `X-Frame-Options: DENY` on HTML responses.
- Set `Strict-Transport-Security` for production domains.
- Return `Content-Type: application/json` on all JSON responses to prevent MIME sniffing.

## Error exposure

```ts
// Never leak internals
try {
  const data = await db.query(sql);
  return ok(data);
} catch (err) {
  console.error('[api-products] DB error:', err);   // log full error server-side
  return fail('Internal server error', 500);        // safe message to client
}
```

## Input sanitization for rich text

When a function accepts HTML or Markdown from users before storing or rendering:

```ts
import { sanitize } from 'isomorphic-dompurify';

const safeHtml = sanitize(rawHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOWED_URI_REGEXP: /^https?:/i,
});
```

## Security checklist

- [ ] All route handlers check auth before data access
- [ ] Input validated with typed assertions, not just truthiness checks
- [ ] Webhook HMAC verified with timingSafeEqual
- [ ] CORS restricted to explicit origin allowlist in production
- [ ] Secrets checked at startup; missing ones crash early
- [ ] Errors logged server-side; safe generic messages returned to clients
- [ ] `Content-Type: application/json` on every JSON response
- [ ] Rate limit rules applied to public and auth endpoints
