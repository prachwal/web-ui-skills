# Error Reporting

Patterns for capturing, reporting, and presenting runtime errors in production web apps.

## Preact ErrorBoundary

Wrap route-level components to prevent a single component crash from taking down the whole app:

```tsx
import { Component, type ComponentChildren, type ErrorInfo } from "preact";

interface ErrorBoundaryState {
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: (error: Error) => ComponentChildren;
  onError?: (error: Error, info: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    reportError(error, { context: "ErrorBoundary", componentStack: info.componentStack });
  }

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.fallback?.(error) ?? (
        <section role="alert" aria-labelledby="error-heading">
          <h2 id="error-heading">Something went wrong</h2>
          <p>Reload the page or <a href="/">return to home</a>.</p>
        </section>
      );
    }
    return this.props.children;
  }
}
```

Usage at the route level:

```tsx
<ErrorBoundary fallback={(err) => <ErrorPage error={err} />}>
  <ProductPage id={params.id} />
</ErrorBoundary>
```

## reportError utility

Unified error reporting with dev/prod split and context sanitization:

```ts
// src/lib/reporting.ts
interface ErrorContext {
  context?: string;
  route?: string;
  userId?: string;       // anonymized or hashed — never raw PII
  releaseVersion?: string;
  [key: string]: unknown;
}

export function reportError(error: Error, ctx: ErrorContext = {}): void {
  const payload = {
    message:        error.message,
    stack:          error.stack,
    releaseVersion: import.meta.env.VITE_APP_VERSION ?? "dev",
    route:          window.location.pathname,
    timestamp:      new Date().toISOString(),
    ...sanitizeContext(ctx),
  };

  if (import.meta.env.DEV) {
    console.error("[reportError]", payload);
    return;
  }

  // Production: send to observability service
  // Replace with your actual Sentry, Datadog, Honeybadger, etc. call
  navigator.sendBeacon("/api/errors", JSON.stringify(payload));
}

function sanitizeContext(ctx: ErrorContext): ErrorContext {
  // Strip any key that looks like it could contain sensitive data
  const BLOCKED_KEYS = new Set(["password", "token", "authorization", "cookie", "secret"]);
  return Object.fromEntries(
    Object.entries(ctx).filter(([k]) => !BLOCKED_KEYS.has(k.toLowerCase())),
  );
}

// Catch global unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));
  reportError(error, { context: "unhandledrejection" });
});
```

## Route-level error reporting wrapper

Wrap async route loaders to capture errors with route context automatically:

```ts
export async function withErrorReporting<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      reportError(error, { context, route: window.location.pathname });
    }
    return null;
  }
}
```

## Source map upload in CI

For stack traces to resolve to readable source, upload source maps after build:

```bash
# Example: Sentry CLI (replace with your provider's CLI)
npx @sentry/cli sourcemaps upload \
  --org "$SENTRY_ORG" \
  --project "$SENTRY_PROJECT" \
  --release "$VITE_APP_VERSION" \
  dist/assets/
# Delete source maps from the deployed bundle after upload
find dist/assets -name "*.map" -delete
```

Never serve `.map` files publicly — they expose your original source.

## Rules

- Catch both synchronous errors (ErrorBoundary) and async errors (`unhandledrejection`).
- Always redact sensitive fields from error context before sending.
- Keep the reporting utility separate from UI components.
- Do not send reports in dev or test environments — use `console.error` instead.
- Include release version in every error report to correlate with deploys.
- Delete or access-control source maps so they are not publicly accessible.
