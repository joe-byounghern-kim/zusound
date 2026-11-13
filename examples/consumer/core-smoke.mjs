import assert from 'node:assert/strict'
import { createSonifier, detectChanges, sonifierOptionKeys, version } from '@zusound/core'

const changes = detectChanges({ count: 1, label: 'a' }, { count: 0, label: 'a' })
assert.deepEqual(
  changes.map(({ path, operation }) => [path, operation]),
  [['count', 'update']]
)
assert.ok(sonifierOptionKeys.includes('debounceMs'))

const sonifier = createSonifier({ enabled: true, debounceMs: 10 })
assert.equal(sonifier.enabled, true)
sonifier.update({ count: 2 }, { count: 1 })
sonifier.play(changes)
sonifier.dispose()
sonifier.dispose()
sonifier.update({ count: 3 }, { count: 2 })

assert.equal(createSonifier({ enabled: false }).enabled, false)
assert.match(version, /^\d+\.\d+\.\d+/)
console.log('@zusound/core ESM import, SSR updates and dispose passed')
