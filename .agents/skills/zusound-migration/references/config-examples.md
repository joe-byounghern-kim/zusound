# Pilot and rollback examples

## Existing store before the pilot

```typescript
import { create } from 'zustand'

type CartState = {
  itemCount: number
  addItem: () => void
}

export const useCartStore = create<CartState>()((set) => ({
  itemCount: 0,
  addItem: () => set((state) => ({ itemCount: state.itemCount + 1 })),
}))
```

Keep this initializer available as the rollback baseline.

## Middleware pilot with preserved composition order

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { zusound } from 'zusound'

type CartState = {
  itemCount: number
  addItem: () => void
}

const cartState: StateCreator<CartState, [], []> = (set) => ({
  itemCount: 0,
  addItem: () => set((state) => ({ itemCount: state.itemCount + 1 })),
})

const enhancedCartState = devtools(
  persist(zusound(cartState, { enabled: true, volume: 0.15, debounceMs: 40 }), {
    name: 'cart',
  })
)

export const useCartStore = create<CartState>()(enhancedCartState)

export function disposeCartStore(): void {
  useCartStore.zusoundCleanup()
}
```

## Subscriber pilot rollback

```typescript
import { createStore } from 'zustand/vanilla'
import { createZusound } from 'zusound'

type CartState = {
  itemCount: number
  addItem: () => void
}

const store = createStore<CartState>()((set) => ({
  itemCount: 0,
  addItem: () => set((state) => ({ itemCount: state.itemCount + 1 })),
}))

const zs = createZusound({ enabled: true, volume: 0.15 })
const unsubscribe = store.subscribe(zs)

export function rollbackSubscriberPilot(): void {
  unsubscribe()
  zs.cleanup()
}
```

After `rollbackSubscriberPilot()`, remove the two attachment declarations. The store itself remains unchanged.

## React StrictMode subscriber pilot

Keep an existing `devtools(persist(...))` store unchanged and attach audio in an effect. Every effect setup creates a fresh instance because cleanup makes the previous instance terminal.

```tsx
import { useEffect } from 'react'
import { createStore } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { createZusound } from 'zusound'

type CartState = {
  itemCount: number
  addItem: () => void
}

const cartStore = createStore<CartState>()(
  devtools(
    persist(
      (set) => ({
        itemCount: 0,
        addItem: () => set((state) => ({ itemCount: state.itemCount + 1 })),
      }),
      { name: 'cart' }
    )
  )
)

export function CartSoundAttachment(): null {
  useEffect(() => {
    const zs = createZusound({ enabled: true, volume: 0.15 })
    const unsubscribe = cartStore.subscribe(zs)

    return () => {
      unsubscribe()
      zs.cleanup()
    }
  }, [])

  return null
}
```

In development StrictMode, setup-cleanup-setup creates and disposes one attachment, then creates a new one. Roll back by allowing cleanup to run and removing `CartSoundAttachment` and its render/import. The persisted and devtools store needs no initializer rollback.
