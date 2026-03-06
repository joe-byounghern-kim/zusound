# Configuration Examples

## Add non-fatal error telemetry

```typescript
const zs = createZusound({
  enabled: true,
  onError: (error, context) => {
    console.warn('[zusound]', context, error)
  },
})

const unsubscribe = store.subscribe(zs)
```

## Minimal symptom repro harness

```typescript
store.getState().inc()
store.getState().inc()
store.getState().inc()
```
