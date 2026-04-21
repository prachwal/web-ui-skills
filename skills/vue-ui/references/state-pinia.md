# Vue State And Pinia

## State Selection

Choose the smallest state scope that fits:

- Local `ref` for component-only UI state.
- `computed` for derived values.
- Composables for reusable behavior shared by a few components.
- Pinia for cross-route, cross-feature, or long-lived client state.
- API/query layer for server state, cache invalidation, retries, and background refresh.

Avoid duplicating the same value in local state, Pinia, and URL params. Pick the source of truth first.

## Pinia Stores

Prefer setup stores for Vue 3 apps:

```ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', () => {
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => token.value !== null)

  function setToken(nextToken: string | null) {
    token.value = nextToken
  }

  return { token, isAuthenticated, setToken }
})
```

Store rules:

- Keep store names stable.
- Keep actions explicit and side-effect aware.
- Keep API calls in services; actions may orchestrate them.
- Do not import route components from stores.
- Avoid storing non-serializable values unless they are intentionally runtime-only.

## Persistence

- Persist only user preferences, session metadata, drafts, or explicit offline state.
- Version persisted payloads.
- Never persist secrets or high-risk personal data in browser storage.
- Clear persisted state on logout or identity switch.

## Testing Stores

- Test actions and derived state as plain behavior.
- Mock the service layer, not Vue reactivity.
- Reset Pinia between tests.
- Cover persistence migrations when persisted schemas change.
