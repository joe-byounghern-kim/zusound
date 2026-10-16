# Configuration examples

These named-factory recipes target Zustand >=4.3 and 5. For 4.1–4.2 use the
default factory imports. Exactly 4.0 also needs the outermost-Zusound forms in
the local [compatibility reference](compatibility.md).

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
state result. For modern typed `devtools` / `persist` composition:

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { zusound } from 'zusound'

type CounterState = { count: number; increment: () => void }
const initializer: StateCreator<CounterState, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})
const enhanced = devtools(
  persist(zusound(initializer, { enabled: true, volume: 0.1 }), { name: 'counter' })
)
export const useCounterStore = create<CounterState>()(enhanced)
export function disposeCounterAudio(): void {
  useCounterStore.zusoundCleanup()
}
```

The modern selector form is `subscribeWithSelector(zusound(initializer))` passed
to curried `createStore<State>()(...)`. Its optional selector subscription owns
its own unsubscribe handle, separate from `store.zusoundCleanup()`.
Do not apply that order to exactly 4.0. Use a subscriber when preserving an
existing stack is safer than changing it.

If changing the initializer is unnecessary, subscribe to the existing store at
a browser lifecycle boundary without rearranging its persisted or devtools stack.

## React effect and StrictMode

Create a fresh instance **inside every effect setup**. Never reuse the terminal
instance from a previous setup. The effect owns only this attachment, not the
shared store or any pre-existing middleware cleanup.

```tsx
import { useEffect } from 'react'
import { create } from 'zustand'
import { createZusound } from 'zusound'

type CounterState = { count: number; increment: () => void }
const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

export function CounterSoundAttachment(): null {
  useEffect(() => {
    const zs = createZusound({ enabled: true, volume: 0.1 })
    const unsubscribe = useCounterStore.subscribe(zs)
    return () => {
      unsubscribe()
      zs.cleanup()
    }
  }, [])
  return null
}

export function Counter(): React.JSX.Element {
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)
  return <button onClick={increment}>Count: {count}</button>
}
```

Mount one `CounterSoundAttachment` at the attachment's ownership boundary.
StrictMode's development setup-cleanup-setup gets two different instances.
Use a direct browser click/tap on the counter after attachment. A mount-time
update does not prove browser activation or audible output.

## Next.js App Router

Place client-only attachment in a `'use client'` component, with Web Audio setup
inside `useEffect`, not module evaluation or render. Client Components can also
be pre-rendered on the server. An SSR-created middleware store uses
`{ enabled: false }` even when that module is imported by a Client Component.
That existing middleware has no public enable/disable setter, so attach a fresh
subscriber on the client instead. In an app, keep stores request/provider-scoped
as appropriate, never share mutable per-user state across server requests.

```tsx
'use client'

import { useEffect } from 'react'
import { createStore, type StateCreator, type StoreApi } from 'zustand/vanilla'
import { createZusound, zusound } from 'zusound'

type CounterState = { count: number; increment: () => void }

// Call from the app's per-request/provider store factory, not a server singleton.
export function makeCounterStore() {
  const initializer: StateCreator<CounterState, [], []> = (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  })
  const enhanced = zusound(initializer, { enabled: false })
  return createStore<CounterState>()(enhanced)
}

// Obtain this store from a client provider. Do not pass a store API across the
// Server Component serialization boundary.
export function CounterSoundAttachment({ store }: { store: StoreApi<CounterState> }): null {
  useEffect(() => {
    const zs = createZusound({ enabled: true, volume: 0.1 })
    const unsubscribe = store.subscribe(zs)
    return () => {
      unsubscribe()
      zs.cleanup()
    }
  }, [store])
  return null
}
```

Only the store owner calls the disabled middleware's `zusoundCleanup()` at
permanent store disposal. The component cleans up only its subscriber. Keep the
provider's store identity stable. Do not add a second attachment to middleware
that is already enabled, since that would duplicate cues.

Further reading: [React effect lifecycle](https://react.dev/reference/react/useEffect),
[Next.js client boundary](https://nextjs.org/docs/app/api-reference/directives/use-client),
and the [API recipes](https://github.com/joe-byounghern-kim/zusound/blob/main/docs/API.md#middleware-composition).

## Rollback

For middleware, restore the saved initializer and remove its audio cleanup call.
For subscribers, execute the two teardown calls before deleting the attachment
declarations or component. The store remains usable and needs no initializer
rollback in subscriber mode. Run the same baseline typecheck, focused tests, and
build and record their results before another store is considered.
