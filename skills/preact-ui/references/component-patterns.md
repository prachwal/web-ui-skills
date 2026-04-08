# Professional Component Patterns

## Component splitting heuristics

Split a component when it:
- Has more than one independently testable concern.
- Contains more than one signal/state group that could change independently.
- Would benefit from independent lazy loading.
- Is reused in more than one place with only prop variation.

Keep it together when splitting would create props drilling with no reuse benefit.

## TypeScript props design

```ts
// Be explicit about optionality and defaults
interface ButtonProps {
  label: string;                           // required
  variant?: 'primary' | 'secondary';      // optional union
  loading?: boolean;                       // optional flag
  onClick?: () => void;                    // optional callback
  disabled?: boolean;
  'aria-label'?: string;                   // forwarded DOM attr
}

// Extend HTML element attrs for primitive wrappers
interface InputProps extends Preact.JSX.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
```

## Controlled vs uncontrolled

```tsx
// Controlled — parent owns state
function ControlledInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onInput={(e) => onChange(e.currentTarget.value)} />;
}

// Uncontrolled — reads value on demand via ref
function UncontrolledInput({ name }: { name: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return <input name={name} ref={ref} />;
}
// Read with: new FormData(form).get(name) or ref.current.value
```

Prefer **controlled** when you need live validation or computed state. Prefer **uncontrolled** for simple single-field forms with no validation.

## Compound components

Group related components under a shared namespace. Children communicate via Context:

```tsx
// components/Tabs/index.tsx
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { useSignal } from '@preact/signals';

interface TabsCtx { active: string; setActive: (id: string) => void; }
const Ctx = createContext<TabsCtx | null>(null);

function Tabs({ defaultTab, children }: { defaultTab: string; children: ComponentChildren }) {
  const active = useSignal(defaultTab);
  return (
    <Ctx.Provider value={{ active: active.value, setActive: v => { active.value = v; } }}>
      <div class="tabs">{children}</div>
    </Ctx.Provider>
  );
}

function Tab({ id, label }: { id: string; label: string }) {
  const ctx = useContext(Ctx)!;
  return (
    <button
      role="tab"
      aria-selected={ctx.active === id}
      onClick={() => ctx.setActive(id)}
    >{label}</button>
  );
}

function TabPanel({ id, children }: { id: string; children: ComponentChildren }) {
  const ctx = useContext(Ctx)!;
  if (ctx.active !== id) return null;
  return <div role="tabpanel">{children}</div>;
}

// Export as a namespace
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
export { Tabs };

// Usage:
// <Tabs defaultTab="a">
//   <Tabs.Tab id="a" label="Alpha" />
//   <Tabs.Panel id="a">…</Tabs.Panel>
// </Tabs>
```

## Render props / children as function

Use when the parent component owns behavior but the consumer controls rendering:

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ComponentChildren;
  renderEmpty?: () => ComponentChildren;
}

function List<T>({ items, renderItem, renderEmpty }: ListProps<T>) {
  if (items.length === 0) return <>{renderEmpty?.() ?? <p>No items.</p>}</>;
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item, i)}</li>)}</ul>;
}

// Usage:
// <List items={products} renderItem={(p) => <span>{p.name}</span>} />
```

## Error boundaries

Preact supports error boundaries via class components:

```tsx
import { Component, ComponentChildren } from 'preact';

interface State { error: Error | null; }

class ErrorBoundary extends Component<{ fallback?: ComponentChildren; children: ComponentChildren }, State> {
  state: State = { error: null };

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? <p role="alert">Something went wrong.</p>;
    }
    return this.props.children;
  }
}

// Wrap any subtree:
// <ErrorBoundary fallback={<ErrorPage />}><FeatureView /></ErrorBoundary>
```

Place error boundaries at route and feature boundaries, not around every component.

## Context API — when to use

Use Context for **cross-cutting concerns** only:

```tsx
// Good uses: theme, locale, auth user, feature flags
const AuthCtx = createContext<{ user: User | null; logout: () => void } | null>(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
```

Do **not** use Context for feature data flow — use signals or props instead. Context causes re-renders for all consumers whenever the value reference changes.

## Portals

Use for modals, tooltips, and popovers that must escape CSS overflow/z-index constraints:

```tsx
import { createPortal } from 'preact/compat';

function Modal({ onClose, children }: { onClose: () => void; children: ComponentChildren }) {
  return createPortal(
    <div class="modal-backdrop" onClick={onClose}>
      <div class="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
```

## Lazy loading and code splitting

```tsx
import { lazy, Suspense } from 'preact/compat';

const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<p>Loading chart…</p>}>
      <HeavyChart />
    </Suspense>
  );
}
```

Apply `lazy()` at route boundaries by default; at component level only when the component is rarely shown and large.

## Memoization — when and how

```tsx
import { memo } from 'preact/compat';

// Wrap a component that re-renders often due to parent updates but receives the same props
const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  return <li>{product.name} — {product.price}</li>;
});
```

Rules:
- Profile first. `memo()` has a comparison cost — it only helps when re-renders are expensive.
- Pass stable callbacks with `useCallback` if they are passed as props to memoized children.
- Never memoize as a default. Memoize only after identifying a concrete bottleneck.

## Forward refs

```tsx
import { forwardRef, useImperativeHandle } from 'preact/compat';

interface InputRef { focus(): void; }

const FancyInput = forwardRef<InputRef, { label: string }>(({ label }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // Expose imperative API via ref
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);
  return (
    <>
      <label>{label}</label>
      <input ref={inputRef} />
    </>
  );
});
```

Prefer prop-driven interaction over imperative refs. Use `forwardRef` only for elements needing focus management or third-party integration.

## Component checklist

- [ ] One main concern per component
- [ ] Props typed explicitly with TypeScript interfaces
- [ ] No business logic inside View components — delegate to ViewModel
- [ ] Error boundary at every route and major feature
- [ ] Accessible: semantic HTML, visible focus, labeled fields
- [ ] Lazy-loaded if large and not needed on initial render
- [ ] Memoized only after profiling confirms a render bottleneck
