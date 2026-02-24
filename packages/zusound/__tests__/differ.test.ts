import { describe, expect, it } from 'vitest'
import { detectChanges } from '../src/differ'

describe('detectChanges value type mapping', () => {
  it('maps function values to object valueType', () => {
    const prev = { handler: () => 'a' }
    const current = { handler: () => 'b' }

    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.valueType).toBe('object')
  })

  it('maps symbol values to object valueType', () => {
    const prev = { token: Symbol('a') }
    const current = { token: Symbol('b') }

    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.valueType).toBe('object')
  })

  it('maps bigint values to object valueType', () => {
    const prev = { amount: BigInt(1) }
    const current = { amount: BigInt(2) }

    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.valueType).toBe('object')
  })

  it('detects Date value updates as changes', () => {
    const prev = { timestamp: new Date(0) }
    const current = { timestamp: new Date(1) }

    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.path).toBe('timestamp')
    expect(changes[0]?.operation).toBe('update')
  })

  it('detects Map value updates as changes', () => {
    const prev = { cache: new Map([['a', 1]]) }
    const current = { cache: new Map([['a', 2]]) }

    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.path).toBe('cache')
    expect(changes[0]?.operation).toBe('update')
  })

  it('detects nested BigInt object updates as changes', () => {
    const prev = { payload: { amount: BigInt(1) } }
    const current = { payload: { amount: BigInt(2) } }

    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.path).toBe('payload')
    expect(changes[0]?.operation).toBe('update')
  })

  it('detects removed keys', () => {
    const prev = { a: 1, b: 2 }
    const current = { a: 1 }
    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.operation).toBe('remove')
    expect(changes[0]?.path).toBe('b')
  })

  it('detects added keys', () => {
    const prev = { a: 1 }
    const current = { a: 1, b: 2 }
    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.operation).toBe('add')
    expect(changes[0]?.path).toBe('b')
  })

  it('detects array value changes', () => {
    const prev = { items: [1, 2, 3] }
    const current = { items: [1, 2, 4] }
    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.valueType).toBe('array')
    expect(changes[0]?.operation).toBe('update')
  })

  it('treats equal Sets as unchanged', () => {
    const prev = { tags: new Set(['a', 'b']) }
    const current = { tags: new Set(['a', 'b']) }

    expect(detectChanges(current, prev)).toHaveLength(0)
  })

  it('detects Set membership changes', () => {
    const prev = { tags: new Set(['a', 'b']) }
    const current = { tags: new Set(['a', 'c']) }

    expect(detectChanges(current, prev)).toHaveLength(1)
  })

  it('detects null to object transition', () => {
    const prev = { user: null }
    const current = { user: { id: 1 } }
    const changes = detectChanges(current, prev)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.operation).toBe('update')
    expect(changes[0]?.path).toBe('user')
  })

  it('uses shallow equality for same-reference nested objects', () => {
    const shared = { x: 1 }
    const prev = { nested: shared }
    const current = { nested: shared }

    expect(detectChanges(current, prev)).toHaveLength(0)
  })

  it('returns no changes for equal primitive root state', () => {
    expect(detectChanges(42, 42)).toHaveLength(0)
  })

  it('detects changes for differing primitive root states', () => {
    const changes = detectChanges(42, 99)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.path).toBe('root')
    expect(changes[0]?.operation).toBe('update')
  })

  it('handles non-object root states (null to value)', () => {
    const changes = detectChanges({ a: 1 }, null)

    expect(changes).toHaveLength(1)
    expect(changes[0]?.path).toBe('root')
  })

  it('treats equal Date objects as unchanged', () => {
    const prev = { timestamp: new Date(1000) }
    const current = { timestamp: new Date(1000) }

    expect(detectChanges(current, prev)).toHaveLength(0)
  })

  it('treats equal Map objects as unchanged', () => {
    const prev = { cache: new Map([['a', 1]]) }
    const current = { cache: new Map([['a', 1]]) }

    expect(detectChanges(current, prev)).toHaveLength(0)
  })

  it('rejects non-plain objects as not shallow-equal', () => {
    // Class instances are not plain objects — always treated as changed
    class Custom {
      x = 1
    }
    const prev = { data: new Custom() }
    const current = { data: new Custom() }

    const changes = detectChanges(current, prev)
    expect(changes).toHaveLength(1)
  })

  it('treats deeply equal nested objects as unchanged via stringify fallback', () => {
    const prev = { config: { nested: { deep: true } } }
    const current = { config: { nested: { deep: true } } }

    expect(detectChanges(current, prev)).toHaveLength(0)
  })

  it('handles circular references gracefully', () => {
    const a: Record<string, unknown> = { x: 1 }
    a.self = a
    const b: Record<string, unknown> = { x: 1 }
    b.self = b

    // Should not throw — returns change because stringify fails for both
    const changes = detectChanges({ data: a }, { data: b })
    expect(changes).toHaveLength(1)
  })
})
