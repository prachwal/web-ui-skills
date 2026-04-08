# Session and storage

## Token storage decision matrix

| Mechanism | XSS risk | CSRF risk | Best for |
|---|---|---|---|
| `HttpOnly` + `Secure` cookie | Low (JS can't read) | Medium (use SameSite) | Traditional server-rendered sessions |
| `SameSite=Strict` cookie | Low | Low | Same-origin SPAs with server auth |
| `localStorage` | **High** (any JS can read) | None | Never for session tokens |
| `sessionStorage` | High (tab-scoped JS) | None | Short-lived non-critical data only |
| In-memory (module variable) | Low | None | JWTs in SPAs (lost on page refresh) |

**Recommended for SPAs**: Store access tokens in memory; use `HttpOnly` refresh token cookies for token renewal.

## Secure cookie attributes

```http
Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

- `HttpOnly` — JavaScript cannot read or steal the cookie.
- `Secure` — Cookie only sent over HTTPS.
- `SameSite=Strict` — Cookie not sent on cross-site requests (strongest CSRF protection).
- `SameSite=Lax` — Cookie sent on top-level navigations (allows OAuth redirects).

## JWT handling in SPAs

```ts
// Refresh token stored in HttpOnly cookie (server sets it)
// Access token stored in memory only

let accessToken: string | null = null;

export async function getAccessToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  // Attempt silent refresh via HttpOnly refresh token cookie
  const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) return null;
  const { token } = await res.json();
  accessToken = token;
  return token;
}

export function clearAccessToken() { accessToken = null; }
```

## What to never store in localStorage

- Session tokens / JWTs
- Refresh tokens
- Private keys
- PII (email, SSN, credit card)
- API secrets or server credentials

`localStorage` is accessible to all JavaScript on the origin, including injected scripts.

## Logout — clean up everything

```ts
export async function logout() {
  clearAccessToken();                                            // clear in-memory token
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); // clear server session + cookie
  localStorage.removeItem('userPreferences');                   // clear non-sensitive persisted state
  window.location.href = '/login';
}
```

## Sensitive data in URLs

Do not put tokens, passwords, or session IDs in:
- Query string parameters (`?token=…`) — logged by servers, visible in referrer headers
- URL path segments that appear in analytics/CDN logs
- Hash fragments for secrets sent to the server

Use `Authorization: Bearer <token>` request headers instead.

## Storage for non-sensitive preferences

`localStorage` is appropriate for user preferences (theme, language, layout), cached non-sensitive API results, and feature flag overrides — not for authentication state.

## Security checklist

- [ ] Session tokens in `HttpOnly; Secure; SameSite` cookies or memory only
- [ ] No JWT / access tokens in `localStorage` or `sessionStorage`
- [ ] Logout clears all token storage and server session
- [ ] Tokens not exposed in URL parameters or browser history
- [ ] Sensitive API responses marked `Cache-Control: no-store`
