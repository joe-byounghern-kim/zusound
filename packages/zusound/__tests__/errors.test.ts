import { describe, expect, it, vi } from 'vitest'
import { createStore } from 'zustand/vanilla'
import { attachZusound } from '../src/adapter'
import * as audio from '../src/audio'
import { reportError } from '../src/errors'
import { zusound } from '../src/index'

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

  it('keeps state updates non-fatal when state processing diagnostics throw', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const original = new Error('state inspection failed')
    const onError = vi.fn(() => {
      throw new Error('telemetry failed')
    })
    let listener: ((current: object, prev: object) => void) | undefined

    const handle = attachZusound(
      {
        getState: () => ({}),
        subscribe: (next) => {
          listener = next
          return () => {}
        },
      },
      { enabled: true, onError }
    )
    const invalidState = new Proxy(
      {},
      {
        ownKeys() {
          throw original
        },
      }
    )

    try {
      expect(() => listener?.(invalidState, {})).not.toThrow()
      expect(onError).toHaveBeenCalledWith(original, { stage: 'state-change-processing' })
    } finally {
      handle.cleanup()
      warnSpy.mockRestore()
      debugSpy.mockRestore()
    }
  })

  it('retains a real Zustand update when state processing diagnostics throw', () => {
    const original = new Error('state inspection failed')
    const onError = vi.fn(() => {
      throw new Error('telemetry failed')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const store = createStore<{ value: object }>()(
      zusound(() => ({ value: {} }), { enabled: true, onError })
    )
    const next = new Proxy(
      {},
      {
        ownKeys: () => {
          throw original
        },
      }
    )

    try {
      expect(() => store.setState({ value: next })).not.toThrow()
      expect(store.getState().value).toBe(next)
      expect(onError).toHaveBeenCalledWith(original, { stage: 'state-change-processing' })
    } finally {
      store.zusoundCleanup()
      warnSpy.mockRestore()
      debugSpy.mockRestore()
    }
  })

  it('does not leave playback rejections unhandled when diagnostics throw', async () => {
    const original = new Error('playback failed')
    const onError = vi.fn(() => {
      throw new Error('telemetry failed')
    })
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const playSoundSpy = vi.spyOn(audio, 'playSound').mockRejectedValue(original)
    let listener: ((current: { count: number }, prev: { count: number }) => void) | undefined

    const handle = attachZusound(
      {
        getState: () => ({ count: 0 }),
        subscribe: (next) => {
          listener = next
          return () => {}
        },
      },
      { enabled: true, onError }
    )

    try {
      listener?.({ count: 1 }, { count: 0 })
      await Promise.resolve()

      expect(playSoundSpy).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        original,
        expect.objectContaining({
          stage: 'playback',
          change: expect.objectContaining({ path: 'count' }),
        })
      )
    } finally {
      handle.cleanup()
      playSoundSpy.mockRestore()
      debugSpy.mockRestore()
    }
  })
})
