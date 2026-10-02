import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { getDemoChanges, getDemoData, useSubscriberStore } from '../src/store.ts'

afterEach(() => useSubscriberStore.getState().reset())

test('removing from an empty list is a true no-op', () => {
  const store = useSubscriberStore
  store.getState().reset()
  while (store.getState().items.length) store.getState().removeItem()
  let updates = 0
  const unsubscribe = store.subscribe(() => updates++)
  const previous = store.getState()
  store.getState().removeItem()
  unsubscribe()
  assert.equal(updates, 0)
  assert.equal(store.getState(), previous)
})

test('counter and toggle updates preserve the other example values', () => {
  const store = useSubscriberStore
  store.getState().reset()
  const items = store.getState().items
  store.getState().increment()
  store.getState().toggle()
  assert.equal(store.getState().count, 1)
  assert.equal(store.getState().toggled, true)
  assert.equal(store.getState().items, items)
})

test('reset restores counter, boolean, and list examples', () => {
  const store = useSubscriberStore
  store.getState().reset()
  const initialItems = [...store.getState().items]
  store.getState().increment()
  store.getState().toggle()
  store.getState().addItem()
  store.getState().reset()
  assert.equal(store.getState().count, 0)
  assert.equal(store.getState().toggled, false)
  assert.deepEqual(store.getState().items, initialItems)
})

test('history describes list replacement as an update, not a key addition', () => {
  const previous = useSubscriberStore.getState()
  previous.addItem()
  const changes = getDemoChanges(useSubscriberStore.getState(), previous)
  assert.equal(changes.length, 1)
  assert.equal(changes[0].path, 'items')
  assert.equal(changes[0].operation, 'update')
  assert.deepEqual(changes[0].oldValue, previous.items)
  assert.deepEqual(changes[0].newValue, useSubscriberStore.getState().items)
})

test('resetting an already initial store does not invent history changes', () => {
  useSubscriberStore.getState().reset()
  const previous = useSubscriberStore.getState()
  previous.reset()
  assert.deepEqual(getDemoChanges(useSubscriberStore.getState(), previous), [])
  assert.deepEqual(getDemoData(previous), { count: 0, toggled: false, items: ['Item 1'] })
})
