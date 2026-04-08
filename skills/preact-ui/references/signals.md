# Signals

Signals are reactive primitive values from `@preact/signals`.
Only the components (or effects) that read a signal re-execute when it changes.

## Install

```sh
npm install @preact/signals
```

## Core API

### signal

```ts
import { signal } from '@preact/signals';

const count = signal(0);

count.value;          // read
count.value = 1;      // write — triggers all subscribers
count.peek();         // read without subscribing
```

### computed

Derived signal — recalculates only when its dependencies change.

```ts
import { signal, computed } from '@preact/signals';

const price = signal(10);
const qty = signal(3);
const total = computed(() => price.value * qty.value);

total.value; // 30 — recomputed when price or qty change
```

### effect

Runs a side effect whenever its dependencies change.
Returns a dispose function.

```ts
import { effect } from '@preact/signals';

const dispose = effect(() => {
  document.title = `Count: ${count.value}`;
});

// Stop the effect
dispose();
```

### batch

Groups multiple signal writes into a single render pass.

```ts
import { batch } from '@preact/signals';

batch(() => {
  price.value = 20;
  qty.value = 5;
}); // one update, not two
```

## Component hooks

Use these inside functional components:

```ts
import { useSignal, useComputed, useSignalEffect } from '@preact/signals';
```

### useSignal

Component-local reactive value.

```tsx
function Counter() {
  const n = useSignal(0);
  return <button onClick={() => n.value++}>{n.value}</button>;
}
```

### useComputed

Derived value scoped to the component.

```tsx
function TempConverter() {
  const celsius = useSignal(20);
  const fahrenheit = useComputed(() => celsius.value * 9 / 5 + 32);
  return (
    <p>{celsius} °C = {fahrenheit} °F</p>
  );
}
```

### useSignalEffect

Component-scoped side effect. Cleaned up on unmount.

```tsx
function Logger() {
  const count = useSignal(0);
  useSignalEffect(() => {
    console.log('count changed:', count.value);
  });
  return <button onClick={() => count.value++}>Log</button>;
}
```

## Fine-grained DOM updates

Pass a signal directly into JSX to update **only** the text node, not the component:

```tsx
// This only updates the DOM node, not the whole component
<span>{count}</span>

// This re-renders the whole component
<span>{count.value}</span>
```

Prefer `{signal}` over `{signal.value}` in JSX where possible.

## Shared state pattern

Define signals in a module (ViewModel store); import in Views:

```ts
// viewmodels/userStore.ts
import { signal, computed } from '@preact/signals';

export const user = signal<User | null>(null);
export const isLoggedIn = computed(() => user.value !== null);

export function login(u: User) { user.value = u; }
export function logout() { user.value = null; }
```

```tsx
// components/NavBar.tsx
import { isLoggedIn, logout } from '../viewmodels/userStore';

export function NavBar() {
  return isLoggedIn.value
    ? <button onClick={logout}>Sign out</button>
    : <a href="/login">Sign in</a>;
}
```

## ReadonlySignal pattern

Expose signals as read-only from ViewModel; keep the write access private:

```ts
import { signal, Signal } from '@preact/signals';

export type ReadonlySignal<T> = Omit<Signal<T>, 'value'> & { readonly value: T };

const _count = signal(0);
export const count: ReadonlySignal<number> = _count;

export function increment() { _count.value++; }
```

## When to use signals vs hooks

| Use case | Recommendation |
|---|---|
| Local toggle / hover / open state | `useSignal` |
| Shared state across components | module-level `signal` |
| Derived / computed value | `computed` / `useComputed` |
| Async data (loading/error/data) | signals in ViewModel |
| DOM side-effect on change | `useSignalEffect` |
| One-time setup / external subscription | `useEffect` |
| Stable function reference | `useCallback` |
