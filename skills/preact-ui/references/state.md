# State Management

## Choosing the right primitive

| Scenario | Primitive |
|---|---|
| Local UI toggle (open, hover) | `useSignal` or `useState` |
| Shared state across components | module-level `signal` in ViewModel |
| Derived / computed value | `computed` or `useComputed` |
| Async data (loading / error / data) | signals in ViewModel + service |
| External subscription / timer | `useEffect` with cleanup |

## Signals (preferred)

```ts
import { signal, computed, effect, batch } from '@preact/signals';

// Module-level shared state
export const count = signal(0);
export const doubled = computed(() => count.value * 2);

// Group writes
batch(() => {
  count.value = 10;
  other.value = 'updated';
});

// Side effects — call dispose() to clean up
const dispose = effect(() => {
  console.log('count is', count.value);
});
```

### In components

```tsx
import { useSignal, useComputed } from '@preact/signals';

function Counter() {
  const n = useSignal(0);
  const label = useComputed(() => `Count: ${n.value}`);
  return <button onClick={() => n.value++}>{label}</button>;
}
```

Pass a signal directly into JSX to update only the DOM node, not the whole component:

```tsx
// Fine-grained DOM update — no component re-render
<span>{count}</span>
```

## Hooks (for lifecycle and local effects)

- `useState` — simple local state that does not need signal semantics.
- `useEffect(fn, deps)` — side effects; always return a cleanup function.
- `useRef` — DOM refs and mutable values that must not trigger re-renders.
- `useMemo(fn, deps)` — expensive computations; prefer `useComputed` with signals.
- `useCallback(fn, deps)` — stable function references for memoized children.
- `useContext` — cross-cutting concerns (auth, theme, i18n); avoid for data flow.

## State rules

- Never duplicate state — use `computed` or `useComputed` for derived values.
- Colocate state with the interaction it drives; lift only when siblings need it.
- Expose loading, error, and empty states explicitly — never leave the UI ambiguous.
- Keep `useEffect` bodies small, focused, and deterministic.
- Prefer signal-based fetch triggers over effects that watch multiple deps.

