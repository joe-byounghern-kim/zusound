import { describe, expect, it, vi } from 'vitest'
import { reportError } from '../src/errors'

describe('reportError', () => {
  it('isolates a throwing diagnostic callback', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const callback = vi.fn(() => {
      throw new Error('telemetry failed')
    })
    const original = new Error('original')

    try {
      expect(() => reportError(original, { stage: 'playback' }, callback)).not.toThrow()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(original, { stage: 'playback' })
    } finally {
      debugSpy.mockRestore()
    }
  })
})
