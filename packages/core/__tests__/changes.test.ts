import { describe, expect, it } from 'vitest'
import { createChangeBuffer } from '../src/changes'
import type { Change } from '../src/types'

const change = (path: string, newValue: number): Change => ({
  path,
  newValue,
  oldValue: newValue - 1,
  operation: 'update',
  valueType: 'number',
})

describe('createChangeBuffer', () => {
  it('retains only the latest change per path in last-occurrence order', () => {
    const buffer = createChangeBuffer()

    for (let value = 1; value <= 10_000; value += 1) {
      buffer.add([change('count', value)])
    }

    expect(buffer.size).toBe(1)

    buffer.add([change('status', 1), change('count', 10_001)])

    const flushed = buffer.flush()
    expect(flushed.map(({ path }) => path)).toEqual(['status', 'count'])
    expect(flushed[1]?.newValue).toBe(10_001)
    expect(buffer.size).toBe(0)
  })

  it('clears retained changes without emitting them', () => {
    const buffer = createChangeBuffer()
    buffer.add([change('count', 1)])

    buffer.clear()

    expect(buffer.size).toBe(0)
    expect(buffer.flush()).toEqual([])
  })
})
