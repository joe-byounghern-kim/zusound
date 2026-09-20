// __ZUSOUND_CREATE_STORE_IMPORT__
import type { StateCreator } from 'zustand/vanilla'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { createZusound, version, zusound } from 'zusound'

type State = { count: number; increment: () => void }
const initializer: StateCreator<State, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

const enhanced = zusound(initializer, { enabled: false })
const store = createStore<State>()(enhanced)
store.zusoundCleanup()
// @ts-expect-error an empty output tuple cannot describe the added cleanup mutator
const erased: StateCreator<State, [], []> = enhanced
void erased

const selectorStore = createStore<State>()(subscribeWithSelector(zusound(initializer)))
selectorStore.subscribe(
  (state) => state.count,
  (count) => {
    const n: number = count
    void n
  }
)
selectorStore.zusoundCleanup()

const persisted = createStore<State>()(devtools(persist(zusound(initializer), { name: 'counter' })))
persisted.persist.clearStorage()
persisted.zusoundCleanup()

const actions = createStore<State>()(
  devtools(
    zusound((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'counter/increment'),
    }))
  )
)
actions.zusoundCleanup()
// @ts-expect-error invalid state values must remain rejected
store.setState({ count: 'invalid' })
// @ts-expect-error cleanup accepts no arguments
store.zusoundCleanup('invalid')
const unenhanced = createStore<State>()(initializer)
// @ts-expect-error stores without the middleware must not claim a cleanup method
unenhanced.zusoundCleanup()
const subscriber = createZusound({ enabled: false })
const listener: (state: State, previousState: State) => void = subscriber
subscriber.cleanup()
void listener
void version
