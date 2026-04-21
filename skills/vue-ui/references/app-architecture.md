# Vue App Architecture

## Application Shape

Use feature-first structure once the app has multiple product areas. Keep shared primitives in `components/`, reusable behavior in `composables/`, route views in feature folders, and cross-cutting setup in `app/`.

Prefer this split:

- `app/` owns `createApp`, global providers, router install, i18n install, and top-level shell.
- `features/<name>/` owns route views, local components, feature stores, validators, and services.
- `components/` contains shared UI that has no product-specific data dependency.
- `composables/` contains reusable reactive behavior with clear input/output contracts.
- `services/` contains API clients, browser adapters, and serialization logic.

## Single-File Components

- Use `<script setup lang="ts">`, `<template>`, and `<style scoped>` for normal components.
- Keep templates declarative; extract branching, formatting, and derived values to `computed`.
- Use PascalCase component filenames for reusable components.
- Use route view filenames that match route or feature names.
- Keep component styles local unless the rule is a token, reset, or layout primitive.

## Component Boundaries

Split a component when it has multiple independent state groups, multiple reasons to change, or a reusable sub-tree. Keep it together when splitting only creates prop forwarding.

Use props for data input and emits for user intent:

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  busy?: boolean
}>(), {
  busy: false,
})

const emit = defineEmits<{
  submit: []
}>()
</script>
```

## Composables

- Name composables as `useXxx`.
- Accept explicit inputs instead of reading global state implicitly.
- Return readonly state and named commands for complex behavior.
- Clean up timers, listeners, and subscriptions with lifecycle hooks.
- Keep UI text out of composables unless the composable specifically owns i18n behavior.

## Accessibility

- Use native controls first.
- Preserve focus order across route and dialog changes.
- Pair every form control with a visible label or accessible name.
- Test keyboard flows for components that own menus, popovers, tabs, dialogs, or combobox behavior.
