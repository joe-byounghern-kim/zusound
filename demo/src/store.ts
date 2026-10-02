import { create } from 'zustand'
import { createZusound, type Change, type ZusoundOptions } from 'zusound'

export type PlaygroundData = {
  count: number
  toggled: boolean
  items: string[]
}

type PlaygroundState = PlaygroundData & {
  increment: () => void
  toggle: () => void
  addItem: () => void
  removeItem: () => void
  reset: () => void
}

const initialData = (): PlaygroundData => ({ count: 0, toggled: false, items: ['Item 1'] })

export const useSubscriberStore = create<PlaygroundState>()((set) => ({
  ...initialData(),
  increment: () => set((state) => ({ count: state.count + 1 })),
  toggle: () => set((state) => ({ toggled: !state.toggled })),
  addItem: () => set((state) => ({ items: [...state.items, `Item ${state.items.length + 1}`] })),
  removeItem: () =>
    set((state) => (state.items.length ? { items: state.items.slice(0, -1) } : state)),
  reset: () => set(initialData()),
}))

export function getDemoData(state: PlaygroundState): PlaygroundData {
  return { count: state.count, toggled: state.toggled, items: state.items }
}

// These three keys always exist. Editing an array is an update, not a key add/remove.
export function getDemoChanges(current: PlaygroundData, previous: PlaygroundData): Change[] {
  const changes: Change[] = []
  for (const path of ['count', 'toggled', 'items'] as const) {
    const next = current[path]
    const before = previous[path]
    const equal =
      path === 'items'
        ? current.items.length === previous.items.length &&
          current.items.every((item, index) => item === previous.items[index])
        : Object.is(next, before)
    if (!equal)
      changes.push({
        path,
        operation: 'update',
        valueType: path === 'count' ? 'number' : path === 'toggled' ? 'boolean' : 'array',
        oldValue: before,
        newValue: next,
      })
  }
  return changes
}

export function bindSubscriberZusound(options: ZusoundOptions): () => void {
  const sound = createZusound(options)
  const unsubscribe = useSubscriberStore.subscribe(sound)
  return () => {
    unsubscribe()
    sound.cleanup()
  }
}
