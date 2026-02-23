# Quick Start

Get Zusound running in a few minutes.

## 1) Install

```bash
npm install zustand zusound
```

## 2) Wrap your store

### Approach A: Middleware Wrap

```typescript
import { create } from 'zustand'
import { zusound } from 'zusound'

type Store = {
  count: number
  inc: () => void
  dec: () => void
}

export const useStore = create<Store>()(
  zusound((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
    dec: () => set((state) => ({ count: state.count - 1 })),
  }))
)
```

### Approach B: Direct Subscriber (New!)

If you don't want to wrap your store, you can simply subscribe to it directly:

```typescript
export const useStore = create<Store>()((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  dec: () => set((state) => ({ count: state.count - 1 })),
}))

// Automatically hear state changes
useStore.subscribe(zusound)
```

Need explicit teardown for dynamically managed listeners? Use `createZusound(...)` and call both `unsubscribe()` and `instance.cleanup()`.

## 3) Trigger state updates

Click around your app or call actions in dev tools. You should hear feedback per state change.

## 4) Tune behavior (optional)

```typescript
const store = create(
  zusound(
    (set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      enabled: true,
      volume: 0.3,
      debounceMs: 30,
      performanceMode: false,
      aesthetics: {
        pleasantness: 0.8,
        brightness: 0.7,
        arousal: 0.6,
        valence: 0.6,
        simultaneity: 1,
        baseMidi: 69,
      },
    }
  )
)
```

## Troubleshooting

- No sound on first action: interact with the page first (browser autoplay policy).
- No sound in production: expected unless `enabled: true` is set.
- Too much CPU on high update rates: enable `performanceMode`.

## Next Steps

- Full package API: `packages/zusound/README.md`
- Development workflow: `DEVELOPMENT.md`
- Live demo: `demo/README.md`
- Guided Signal Lab walkthrough: run `pnpm build` then `node demo/server.js`
- React strict TypeScript compatibility demo: `examples/README.md`
