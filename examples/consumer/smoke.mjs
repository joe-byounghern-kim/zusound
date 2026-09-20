import assert from 'node:assert/strict'
import * as vanilla from 'zustand/vanilla'
import { createZusound, version, zusound } from 'zusound'

const createStore = vanilla.createStore ?? vanilla.default
const store = createStore(
  zusound((set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }), {
    enabled: true,
  })
)
store.getState().inc()
assert.equal(store.getState().count, 1)
assert.equal(typeof store.zusoundCleanup, 'function')
store.zusoundCleanup()
store.zusoundCleanup()
store.getState().inc()
assert.equal(store.getState().count, 2)
const instance = createZusound({ enabled: true })
const unsubscribe = store.subscribe(instance)
store.setState({ count: 3 })
unsubscribe()
instance.cleanup()
instance.cleanup()
assert.equal(store.getState().count, 3)
assert.match(version, /^\d+\.\d+\.\d+/)
console.log('ESM import, SSR updates and cleanup passed')
