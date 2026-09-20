import { createStore, type StateCreator } from 'zustand/vanilla'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { zusound } from '../src/index'

type State = {
  count: number
  inc: () => void
}

const state: StateCreator<State, [], []> = (set) => ({
  count: 0,
  inc: () => set((current) => ({ count: current.count + 1 })),
})

const enhanced = zusound(state, { enabled: false })
const enhancedStore = createStore<State>()(enhanced)
enhancedStore.zusoundCleanup()
// @ts-expect-error explicit empty output metadata cannot represent the cleanup mutator
const legacyEnhanced: StateCreator<State, [], []> = zusound(state, { enabled: false })
void legacyEnhanced

const plain = createStore<State>()(zusound(state, { enabled: false }))
plain.zusoundCleanup()

const selected = createStore<State>()(subscribeWithSelector(zusound(state, { enabled: false })))
selected.subscribe(
  (current) => current.count,
  (count) => {
    const verified: number = count
    void verified
  }
)
selected.zusoundCleanup()

const persisted = createStore<State>()(
  devtools(persist(zusound(state, { enabled: false }), { name: 'counter' }))
)
persisted.setState({ count: 1 }, false, 'counter/increment')
persisted.persist.clearStorage()
persisted.zusoundCleanup()

const inferred = createStore<State>()(
  zusound(
    (set) => ({
      count: 0,
      inc: () => set((current) => ({ count: current.count + 1 })),
    }),
    { enabled: false }
  )
)
inferred.zusoundCleanup()

const unenhanced = createStore<State>()(state)

// @ts-expect-error invalid state updates remain rejected
plain.setState({ count: 'invalid' })
// @ts-expect-error cleanup does not accept arguments
plain.zusoundCleanup('invalid')
// @ts-expect-error a Zustand store without zusound does not expose cleanup
unenhanced.zusoundCleanup()
