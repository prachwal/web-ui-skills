# Session Management

Patterns for handling session state, expiry, token storage, and role-based UI guards.

## Session expiry interceptor

Intercept 401 responses globally and redirect to login, preserving the original URL for post-login return:

```ts
// src/lib/api.ts
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);

  if (res.status === 401) {
    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.href = `/auth/login?returnTo=${returnTo}`;
    // Return the response object even though the redirect will happen.
    // Callers should not continue processing after a 401.
    return res;
  }

  return res;
}
```

On the login page after successful auth:

```ts
function redirectAfterLogin() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");

  // Validate the return URL — only allow same-origin paths
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    window.location.href = returnTo;
  } else {
    window.location.href = "/dashboard";
  }
}
```

Always validate `returnTo` to prevent open redirect vulnerabilities.

## Role/permission guard (UI layer)

Mirror server-side roles in the UI for UX only — security enforcement stays on the server:

```ts
// src/lib/auth.ts
export type Role = "admin" | "editor" | "viewer";

export interface AuthUser {
  id: string;
  displayName: string;
  role: Role;
}

export const permissions = {
  canEdit:   (role: Role) => role === "admin" || role === "editor",
  canDelete: (role: Role) => role === "admin",
  canExport: (role: Role) => role === "admin" || role === "editor",
} as const;
```

In components:

```tsx
import { permissions } from "../lib/auth";

// Use in JSX — the element is absent from the DOM, not just hidden
{permissions.canEdit(user.role) && (
  <button aria-label="Edit product">Edit</button>
)}

{permissions.canDelete(user.role) && (
  <button aria-label="Delete product" class="btn-danger">Delete</button>
)}
```

For route-level guards, redirect before rendering:

```ts
// In a Preact Router route component:
function AdminRoute({ component: Page, user }: AdminRouteProps) {
  if (!user || user.role !== "admin") {
    return <Redirect to="/403" />;
  }
  return <Page />;
}
```

## Secure token storage rules

| Storage | Safe for | Not safe for |
|---|---|---|
| `HttpOnly; Secure; SameSite=Strict` cookie | Session tokens, refresh tokens | Anything that JS must read |
| `sessionStorage` | Transient UI state (current wizard step) | Auth tokens, PII |
| `localStorage` | User preferences (theme, language) | Auth tokens, passwords, secrets |
| In-memory (module variable) | Short-lived access tokens (SPA with no refresh) | Anything that must persist across refresh |

Rules:
- Store session tokens in `HttpOnly` cookies; never `localStorage`.
- Clear all auth state on logout: call the server to invalidate the session, then clear cookies and any in-memory state.
- Never log tokens, passwords, or auth headers — even in dev.
- Use short-lived access tokens with server-side refresh rotation when possible.

## Logout flow

```ts
async function logout() {
  try {
    // Server invalidates the session cookie
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    // Clear any local in-memory state regardless of server success
    clearAuthState();
    window.location.href = "/auth/login";
  }
}
```

Always clear local state in a `finally` block so client-side auth state is removed even if the server call fails.
