# Compatibility and lifecycle

The package Zustand peer range is `>=4.0.0 <6.0.0`. Keep that range separate
from the factory imports and middleware order required by a particular version:

| Zustand     | Factory imports                  | Composition                                                                           |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| Exactly 4.0 | Default `create` / `createStore` | Zusound outermost around selector, persist, or devtools                               |
| 4.1–4.2     | Default `create` / `createStore` | Modern outer compositions, such as `devtools(persist(zusound(initializer), options))` |
| 4.3–4.4     | Named `create` / `createStore`   | Modern outer compositions                                                             |
| >=4.5 and 5 | Named `create` / `createStore`   | Modern outer compositions                                                             |

Real packed-consumer checks passed on 4.1.5 and 4.2.0 with default factories
and modern compositions, and on 4.3.0 and 4.4.7 with named factories and modern
compositions. Zustand 4.1–4.4 is supported in those checked forms, not an
unsupported gap. Named imports fail on 4.1.5 and 4.2.0. These are representative
versions, not a claim that every patch and arbitrary middleware stack was tested.

## Exactly Zustand 4.0: legacy TypeScript forms

This `cts` example is for Zustand 4.0 declarations, not Zustand 5. It retains
the legacy factory imports and outermost-Zusound forms checked by the packed
4.0 consumer fixture. Preserve an existing store's actions and persistence key.

```cts
import createStore from 'zustand/vanilla'
import create from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { zusound } from 'zusound'

type State = { count: number; increment: () => void }
const initializer: StateCreator<State, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

const enhanced = zusound(initializer, { enabled: true, volume: 0.1 })
export const store = createStore<State>()(enhanced)
export const useCounterStore = create<State>()(enhanced)

export const selectorStore = createStore<State>()(
  zusound(
    subscribeWithSelector((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }))
  )
)
export const persisted = createStore<State>()(
  zusound(
    persist(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      { name: 'counter' }
    )
  )
)
export const actions = createStore<State>()(
  zusound(
    devtools((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'counter/increment'),
    }))
  )
)

// Only at permanent disposal of each store, not on a consuming React unmount.
export function disposeAudio(): void {
  store.zusoundCleanup()
  useCounterStore.zusoundCleanup()
  selectorStore.zusoundCleanup()
  persisted.zusoundCleanup()
  actions.zusoundCleanup()
}
```

These are alternative stores, not instructions to create five stores in an app.
For an existing combined persist/devtools stack, a separate subscriber can leave
its exact initializer and middleware order unchanged: create a fresh
`createZusound()` per attachment, call `store.subscribe(zs)`, then dispose with
`unsubscribe()` followed by `zs.cleanup()`. Do not use a cleaned-up instance again.
For 4.1–4.2 use the default imports above with the modern wrapper order, not the
4.0-only ordering exception. In NodeNext projects those legacy default factories
are checked through CommonJS `.cts`, and through `.ts` with Bundler resolution.

## Enablement, ownership, and evidence

- Keep a typed initializer and infer the enhanced intermediate before curried
  `create<State>()(enhanced)` / `createStore<State>()(enhanced)`. Do not annotate
  the enhanced result as `StateCreator<State, [], []>`, cast away errors, or use
  `skipLibCheck` to hide declaration failures.
- Recognized development/test environments default on. Production and unknown
  environments default off. Use `{ enabled: true }` for a deliberate reproduction.
- Import is SSR-safe. An SSR-created middleware store uses `{ enabled: false }`.
  Attach a fresh browser subscriber inside a client effect for client activation.
  Existing middleware has no public enable/disable setter.
- Middleware owns `store.zusoundCleanup()` at permanent store disposal. Do not
  clean up a shared middleware store on every consuming component unmount.
  Instance `cleanup()` does not detach middleware stores.
- Subscriber attachments own both `unsubscribe()` and `zs.cleanup()`. React
  StrictMode setup-cleanup-setup needs a fresh `createZusound()` inside each effect
  setup. See the local [configuration examples](config-examples.md).
- `debounceMs` is milliseconds, trailing-edge, and retains the last descriptor
  per changed top-level path. It is not a net diff or global rate limiter.
- `AestheticParams.duration` is seconds. `soundMapping[path].duration` is milliseconds.
- Use a direct click/tap and one immutable top-level update. Keep visual feedback
  and audio optional. Automated state, callback, and cleanup checks are not human
  listening evidence. Never claim mocked or automated Web Audio was audible.

Further reading, not required for this installed skill:
[API reference](https://github.com/joe-byounghern-kim/zusound/blob/main/docs/API.md),
[4.0 consumer fixture](https://github.com/joe-byounghern-kim/zusound/blob/main/examples/consumer/smoke-v4.cts).
