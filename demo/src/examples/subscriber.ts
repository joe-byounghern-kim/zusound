import { createStore } from 'zustand/vanilla'
import { createZusound } from 'zusound'

const store = createStore<{ count: number; increment: () => void }>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Call from a click or tap. Keep the returned function for teardown.
export function enableSound() {
  const sound = createZusound({ enabled: true, volume: 0.15, debounceMs: 0 })
  const unsubscribe = store.subscribe(sound)
  store.getState().increment()

  return () => {
    unsubscribe()
    sound.cleanup()
  }
}
