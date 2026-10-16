# Minimal diagnostic configuration

Named factories below target Zustand >=4.3 and 5. Use the default factory import
on 4.0–4.2 as shown in the local [compatibility reference](compatibility.md).

```typescript
import { createStore } from 'zustand/vanilla'
import { createZusound, type ZusoundOptions } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const options: ZusoundOptions = {
  enabled: true,
  volume: 0.1,
  debounceMs: 0,
  onError: (error, context) => console.warn('Zusound diagnostic', context.stage, error),
}

const store = createStore<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

const zs = createZusound(options)
const unsubscribe = store.subscribe(zs)

export function triggerFromUserGesture(): void {
  store.getState().increment()
}

export function disposeDiagnosticAttachment(): void {
  unsubscribe()
  zs.cleanup()
}
```

This configuration makes the lifecycle and error boundary observable. It does not establish that audio was audible.
