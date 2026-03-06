# Configuration Examples

## Pilot store setup

```typescript
const usePilotStore = create(
  zusound(
    (set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      enabled: true,
      volume: 0.24,
      debounceMs: 50,
      performanceMode: true,
    }
  )
)
```

## Rollback snippet

```typescript
// rollback: remove zusound wrapper and restore previous initializer
export const usePilotStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))
```
