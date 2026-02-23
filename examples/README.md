# React TypeScript Demo

This directory is a strict TypeScript compatibility demo for `zusound` using React + Vite.

## Why this demo exists

- Uses a major frontend framework stack used by many TypeScript users.
- Validates `zusound` + Zustand integration under strict type checking.
- Helps catch integration regressions before users see type errors in their apps.

## Run

From repository root:

```bash
pnpm install
pnpm demo:react:typecheck
pnpm demo:react:dev
```

Open `http://localhost:5173`.

## Build check

```bash
pnpm demo:react:typecheck
pnpm demo:react:build
```

## Key patterns

The demo showcases two primary integration strategies:

**1. Middleware Wrap (Traditional)**

```ts
export const useStore = create<StoreType>()(zusound((set) => ({ ... })))
```

This mirrors current guidance for strict TypeScript middleware integration.

**2. Direct Subscriber (New)**

```ts
export const useStore = create<StoreType>()((set) => ({ ... }))

// Somewhere in a component or effect:
const zs = createZusound({...options})
const unsubscribe = useStore.subscribe(zs)
```

This is a lighter-touch approach for adding/removing audio dynamically without wrapping the entire store definition.
