# Configuration Examples

## Middleware integration

```typescript
import { create } from 'zustand'
import { zusound } from 'zusound'

export const useStore = create(
  zusound((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))
)
```

## Subscriber integration with explicit cleanup

```typescript
import { createZusound } from 'zusound'

const zs = createZusound({ enabled: true, volume: 0.3, debounceMs: 40 })
const unsubscribe = store.subscribe(zs)

// teardown
unsubscribe()
zs.cleanup()
```
