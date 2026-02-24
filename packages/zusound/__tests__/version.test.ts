import { describe, expect, it } from 'vitest'
import { version } from '../src/version'

describe('version export', () => {
  it('returns a non-empty string', () => {
    expect(typeof version).toBe('string')
    expect(version.length).toBeGreaterThan(0)
  })
})
