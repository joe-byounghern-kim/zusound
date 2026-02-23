import { zusound, createZusound, type Change, type ZusoundOptions } from 'zusound'
import { create } from 'zustand'

/* ─── State Shape ─── */

type PlaygroundState = {
  count: number
  toggled: boolean
  status: 'idle' | 'loading' | 'success' | 'error'
  items: string[]
  user: { name: string; active: boolean }

  increment: () => void
  decrement: () => void
  toggle: () => void
  addItem: () => void
  removeItem: () => void
  cycleStatus: () => void
  updateUser: (patch: Partial<{ name: string; active: boolean }>) => void
  reset: () => void
}

export type PlaygroundData = Pick<
  PlaygroundState,
  'count' | 'toggled' | 'status' | 'items' | 'user'
>

export const DATA_KEYS: Array<keyof PlaygroundData> = [
  'count',
  'toggled',
  'status',
  'items',
  'user',
]

/* ─── Initial State ─── */

const INITIAL: PlaygroundData = {
  count: 0,
  toggled: false,
  status: 'idle',
  items: ['apple', 'banana'],
  user: { name: 'Guest', active: true },
}

const STATUS_CYCLE: PlaygroundState['status'][] = ['idle', 'loading', 'success', 'error']

/* ─── State Creator ─── */

function createPlayground(
  set: (fn: Partial<PlaygroundState> | ((s: PlaygroundState) => Partial<PlaygroundState>)) => void,
): PlaygroundState {
  return {
    ...INITIAL,
    increment: () => set((s) => ({ count: s.count + 1 })),
    decrement: () => set((s) => ({ count: s.count - 1 })),
    toggle: () => set((s) => ({ toggled: !s.toggled })),
    addItem: () =>
      set((s) => ({ items: [...s.items, `item-${Date.now().toString(36).slice(-4)}`] })),
    removeItem: () => set((s) => ({ items: s.items.slice(0, -1) })),
    cycleStatus: () =>
      set((s) => {
        const idx = STATUS_CYCLE.indexOf(s.status)
        return { status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]! }
      }),
    updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
    reset: () => set(INITIAL),
  }
}

/* ─── Default Options ─── */

export const defaultOptions: ZusoundOptions = {
  enabled: true,
  volume: 0.3,
  debounceMs: 50,
  aesthetics: {
    pleasantness: 0.7,
    brightness: 0.6,
    arousal: 0.6,
    valence: 0.6,
    simultaneity: 1,
    baseMidi: 69,
  },
  mapChangeToAesthetics: (change: Change) => {
    if (change.operation === 'add') return { pleasantness: 0.88, valence: 0.82 }
    if (change.operation === 'remove') return { pleasantness: 0.34, arousal: 0.72 }
    return { pleasantness: 0.64 }
  },
}

/* ─── Stores ─── */

export const useMiddlewareStore = create<PlaygroundState>()(
  zusound(
    (set) => createPlayground(set),
    defaultOptions,
  ),
)

export const useSubscriberStore = create<PlaygroundState>()((set) => createPlayground(set))

/* ─── Subscriber Binding ─── */

export function bindSubscriberZusound(options: ZusoundOptions = defaultOptions): () => void {
  const instance = createZusound(options)
  const unsubscribe = useSubscriberStore.subscribe(instance)
  return () => {
    unsubscribe()
    instance.cleanup()
  }
}
