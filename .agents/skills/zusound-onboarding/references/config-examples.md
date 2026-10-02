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

// Wire to a direct browser click or tap.
export function incrementFromUserGesture(): void {
  useCounterStore.getState().increment()
}

// Call only when the store's audio integration is permanently disposed.
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

export function incrementFromUserGesture(): void {
  store.getState().increment()
}

export function disposeAttachment(): void {
  unsubscribe()
  zs.cleanup()
}
```

Choose this when the attachment has an explicit owner. Do not reuse `zs` after `disposeAttachment()`.

## Existing stores and middleware

Save the exact initializer and middleware order and run the consumer's baseline
checks before changing one store. Preserve the same immutable action and visible
state result. For typed `devtools` / `persist` and selector compositions, use the
[API recipes](../../../../docs/API.md#middleware-composition), including the
ordering exception for exactly Zustand 4.0.

If changing the initializer is unnecessary, subscribe to the existing store at
a browser lifecycle boundary. The [React effect recipe](../../../../docs/API.md#react-effect-and-strictmode)
creates a fresh instance for every setup, including StrictMode setup-cleanup-setup.
It works without rearranging an existing persisted or devtools store.

## Rollback

For middleware, restore the saved initializer and remove its audio cleanup call.
For subscribers, execute the two teardown calls before deleting the attachment
declarations or component. The store remains usable and needs no initializer
rollback in subscriber mode. Run the same baseline typecheck, focused tests, and
build and record their results before another store is considered.
