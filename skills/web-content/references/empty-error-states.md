# Empty States and Error Pages

Patterns for helpful empty states, 404 pages, and 500 error pages.

## EmptyState component (Preact)

```tsx
// src/components/EmptyState.tsx
interface EmptyStateProps {
  icon?:        string;               // SVG src or emoji
  title:        string;
  description:  string;
  action?:      { label: string; href: string } | { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <section class="empty-state" aria-labelledby="empty-title">
      {icon && <img src={icon} alt="" aria-hidden="true" class="empty-state__icon" />}
      <h2 id="empty-title" class="empty-state__title">{title}</h2>
      <p class="empty-state__desc">{description}</p>
      {action && (
        "href" in action
          ? <a href={action.href} class="btn btn--primary">{action.label}</a>
          : <button type="button" class="btn btn--primary" onClick={action.onClick}>{action.label}</button>
      )}
    </section>
  );
}

// Usage examples:
<EmptyState
  title="No products found"
  description="Try adjusting your filters or search terms."
  action={{ label: "Clear filters", onClick: clearFilters }}
/>

<EmptyState
  title="Your cart is empty"
  description="Add items from the store to get started."
  action={{ label: "Browse products", href: "/products" }}
/>
```

## EmptyState guidelines

| Empty scenario | Title pattern | CTA |
|---|---|---|
| Empty search / filter | "No results for [query]" or "No [items] found" | "Clear filters" or "Try a different search" |
| Empty collection (no data yet) | "No [items] yet" | "Create your first [item]" |
| Permission denied (empty from user's perspective) | "Nothing to show here" (do not expose reason) | Link to help or support |
| Feature not available | "[Feature] is not available for your plan" | "Upgrade" or "Learn more" |
| Loading failed (treat like error) | Show error state, not empty state | "Try again" |

## 404 page

```tsx
// src/pages/NotFoundPage.tsx
export function NotFoundPage() {
  return (
    <main class="error-page" aria-labelledby="not-found-title">
      <h1 id="not-found-title">Page not found</h1>
      <p>
        The page you are looking for may have moved or no longer exists.
      </p>
      <nav aria-label="Recovery options">
        <a href="/" class="btn btn--primary">Return to home</a>
        <a href="/products" class="btn">Browse products</a>
        <a href="/contact" class="btn">Contact support</a>
      </nav>
      <p class="error-page__code">Error 404</p>
    </main>
  );
}
```

## 500 / error page

```tsx
// src/pages/ErrorPage.tsx
interface ErrorPageProps {
  error?: Error;
}

export function ErrorPage({ error }: ErrorPageProps) {
  return (
    <main class="error-page" aria-labelledby="error-title">
      <h1 id="error-title">Something went wrong</h1>
      <p>
        We have been notified and are looking into the issue.
        Please try again — or contact support if the problem persists.
      </p>
      <nav aria-label="Recovery options">
        <a href="/" class="btn btn--primary">Return to home</a>
        <button
          type="button"
          class="btn"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </nav>
      {/* Show error details in dev only — never in production */}
      {import.meta.env.DEV && error && (
        <details class="error-page__details">
          <summary>Error details (development only)</summary>
          <pre>{error.stack ?? error.message}</pre>
        </details>
      )}
    </main>
  );
}
```

## Rules

- Error and empty pages must match the site's navigation and branding.
- Never expose stack traces, file paths, or database error messages to users.
- Every error page must offer at least one forward path.
- 404 pages should not be `noindex` by default — some 404s can be valuable in search (e.g. former high-traffic pages).
- Log 404s server-side to detect and fix broken internal and external links.
- Keep separate designs for "that URL never existed" and "you do not have permission to see this" to avoid confusion — but merge them when revealing the difference is a security risk.
