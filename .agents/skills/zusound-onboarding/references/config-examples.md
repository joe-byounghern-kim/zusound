# Configuration examples

## Middleware choice

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { zusound } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const counterState: StateCreator<CounterState, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

const enhancedCounterState = zusound(counterState, { enabled: true, volume: 0.2 })

export const useCounterStore = create<CounterState>()(enhancedCounterState)

export function disposeCounterStore(): void {
  useCounterStore.zusoundCleanup()
}
```

Choose this when the store has a permanent disposal boundary.

## Subscriber choice

```typescript
import { createStore } from 'zustand/vanilla'
import { createZusound } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const store = createStore<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

const zs = createZusound({ enabled: true, volume: 0.2 })
const unsubscribe = store.subscribe(zs)

export function disposeAttachment(): void {
  unsubscribe()
  zs.cleanup()
}
```

Choose this when the attachment has an explicit owner. Do not reuse `zs` after `disposeAttachment()`.
