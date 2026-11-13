import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as audio from '../src/audio'
import { cleanupAudio } from '../src/audio'
import {
  createSonifier,
  detectChanges,
  sonifierOptionKeys,
  type Change,
  type SonifierOptions,
} from '../src/index'

const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  sampleRate: 44100,
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  createPeriodicWave: vi.fn(() => ({}) as PeriodicWave),
  createOscillator: vi.fn(() => ({
    frequency: { setValueAtTime: vi.fn() },
    setPeriodicWave: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  destination: {},
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn(function () {
    return mockAudioContext
  }),
})

const change = (path: string, newValue: unknown, oldValue: unknown): Change => ({
  path,
  operation: 'update',
  valueType: 'number',
  newValue,
  oldValue,
})

describe('createSonifier', () => {
  beforeEach(() => {
    cleanupAudio()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupAudio()
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('enablement', () => {
    it('returns an inert sonifier that holds no audio when disabled', () => {
      const retainSpy = vi.spyOn(audio, 'retainAudioEngine')
      const playSoundSpy = vi.spyOn(audio, 'playSound')
      const sonifier = createSonifier({ enabled: false })

      sonifier.update({ count: 1 }, { count: 0 })
      sonifier.play([change('count', 1, 0)])
      sonifier.dispose()

      expect(sonifier.enabled).toBe(false)
      expect(Object.isFrozen(sonifier)).toBe(true)
      expect(retainSpy).not.toHaveBeenCalled()
      expect(playSoundSpy).not.toHaveBeenCalled()
      expect(window.AudioContext).not.toHaveBeenCalled()
    })

    it('defaults to disabled in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const sonifier = createSonifier()

      sonifier.update({ count: 1 }, { count: 0 })

      expect(sonifier.enabled).toBe(false)
      expect(window.AudioContext).not.toHaveBeenCalled()
    })

    it('defaults to enabled in development and retains the engine once at creation', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const retainSpy = vi.spyOn(audio, 'retainAudioEngine')
      const sonifier = createSonifier()

      expect(sonifier.enabled).toBe(true)
      expect(Object.isFrozen(sonifier)).toBe(true)
      expect(retainSpy).toHaveBeenCalledTimes(1)

      sonifier.update({ count: 1 }, { count: 0 })
      expect(window.AudioContext).toHaveBeenCalledTimes(1)
      sonifier.dispose()
    })

    it('lets an explicit enabled flag override production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const sonifier = createSonifier({ enabled: true })

      sonifier.update({ count: 1 }, { count: 0 })

      expect(window.AudioContext).toHaveBeenCalledTimes(1)
      sonifier.dispose()
    })
  })

  describe('option diagnostics', () => {
    it('lists every recognized option key', () => {
      expect([...sonifierOptionKeys].sort()).toEqual(
        [
          'aesthetics',
          'debounceMs',
          'enabled',
          'mapChangeToAesthetics',
          'onError',
          'performanceMode',
          'soundMapping',
          'volume',
        ].sort()
      )
      expect(Object.isFrozen(sonifierOptionKeys)).toBe(true)
    })

    it('warns about unknown keys in development even when disabled', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      createSonifier({ enabled: false, volum: 0.8 } as SonifierOptions)

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith('Zusound: Unknown option keys: volum')
    })

    it('does not warn about unknown keys in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      createSonifier({ enabled: false, volum: 0.8 } as SonifierOptions)

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('playback', () => {
    it('plays one staggered cue per changed key on update', () => {
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const sonifier = createSonifier({ enabled: true })

      sonifier.update({ a: 1, b: 1, c: 0 }, { a: 0, b: 0, c: 0 })

      expect(playSoundSpy).toHaveBeenCalledTimes(2)
      expect(playSoundSpy.mock.calls[0]?.[0]).toMatchObject({ path: 'a' })
      expect(playSoundSpy.mock.calls[0]?.[1]).toMatchObject({ startOffset: 0 })
      expect(playSoundSpy.mock.calls[1]?.[0]).toMatchObject({ path: 'b' })
      expect(playSoundSpy.mock.calls[1]?.[1]).toMatchObject({ startOffset: 0.04 })
      sonifier.dispose()
    })

    it('caps the stagger offset for large batches', () => {
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const sonifier = createSonifier({ enabled: true })
      const changes = Array.from({ length: 20 }, (_, i) => change(`k${i}`, 1, 0))

      sonifier.play(changes)

      expect(playSoundSpy).toHaveBeenCalledTimes(20)
      expect(playSoundSpy.mock.calls[19]?.[1]).toMatchObject({ startOffset: 0.4 })
      sonifier.dispose()
    })

    it('plays changes it did not detect itself', () => {
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const sonifier = createSonifier({ enabled: true })
      const changes = detectChanges({ count: 2 }, { count: 1 })

      sonifier.play(changes)

      expect(playSoundSpy).toHaveBeenCalledTimes(1)
      expect(playSoundSpy.mock.calls[0]?.[0]).toBe(changes[0])
      sonifier.dispose()
    })

    it('forwards sound options to every cue', () => {
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const onError = vi.fn()
      const mapChangeToAesthetics = () => ({ brightness: 0.2 })
      const soundMapping = { count: { frequency: 440 } }
      const sonifier = createSonifier({
        enabled: true,
        volume: 0.6,
        soundMapping,
        aesthetics: { pleasantness: 0.4 },
        mapChangeToAesthetics,
        performanceMode: true,
        onError,
      })

      sonifier.update({ count: 1 }, { count: 0 })

      expect(playSoundSpy.mock.calls[0]?.[1]).toMatchObject({
        globalVolume: 0.6,
        soundMapping,
        aesthetics: { pleasantness: 0.4 },
        mapChangeToAesthetics,
        performanceMode: true,
        onError,
      })
      sonifier.dispose()
    })

    it('reports state-processing failures without throwing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const failure = new Error('state inspection failed')
      const onError = vi.fn()
      const sonifier = createSonifier({ enabled: true, onError })
      const invalidState = new Proxy(
        {},
        {
          ownKeys() {
            throw failure
          },
        }
      )

      expect(() => sonifier.update(invalidState, {})).not.toThrow()
      expect(onError).toHaveBeenCalledWith(failure, { stage: 'state-change-processing' })
      expect(warnSpy).toHaveBeenCalledWith('Zusound: Error processing state change', failure)
      sonifier.dispose()
    })

    it('reports rejected playback with the change that failed', async () => {
      vi.spyOn(console, 'debug').mockImplementation(() => undefined)
      const failure = new Error('playback failed')
      vi.spyOn(audio, 'playSound').mockRejectedValue(failure)
      const onError = vi.fn()
      const sonifier = createSonifier({ enabled: true, onError })

      sonifier.update({ count: 1 }, { count: 0 })
      await Promise.resolve()

      expect(onError).toHaveBeenCalledWith(
        failure,
        expect.objectContaining({
          stage: 'playback',
          change: expect.objectContaining({ path: 'count' }),
        })
      )
      sonifier.dispose()
    })
  })

  describe('debounce', () => {
    it('keeps the latest change per key, ordered by last occurrence', async () => {
      vi.useFakeTimers()
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const sonifier = createSonifier({ enabled: true, debounceMs: 20 })

      sonifier.update({ a: 1, b: 0 }, { a: 0, b: 0 })
      sonifier.update({ a: 1, b: 1 }, { a: 1, b: 0 })
      sonifier.update({ a: 2, b: 1 }, { a: 1, b: 1 })
      expect(playSoundSpy).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(25)

      expect(playSoundSpy).toHaveBeenCalledTimes(2)
      expect(playSoundSpy.mock.calls[0]?.[0]).toMatchObject({ path: 'b', newValue: 1 })
      expect(playSoundSpy.mock.calls[1]?.[0]).toMatchObject({ path: 'a', newValue: 2 })
      sonifier.dispose()
    })

    it('restarts the debounce window on updates with no changes', async () => {
      vi.useFakeTimers()
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const sonifier = createSonifier({ enabled: true, debounceMs: 20 })

      sonifier.update({ count: 1 }, { count: 0 })
      await vi.advanceTimersByTimeAsync(15)
      sonifier.update({ count: 1 }, { count: 1 })
      await vi.advanceTimersByTimeAsync(10)
      expect(playSoundSpy).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(15)
      expect(playSoundSpy).toHaveBeenCalledTimes(1)
      expect(playSoundSpy.mock.calls[0]?.[0]).toMatchObject({ path: 'count', newValue: 1 })
      sonifier.dispose()
    })

    it('debounces changes passed to play as well', async () => {
      vi.useFakeTimers()
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const sonifier = createSonifier({ enabled: true, debounceMs: 20 })

      sonifier.play([change('count', 1, 0)])
      sonifier.play([change('count', 2, 1)])
      await vi.advanceTimersByTimeAsync(25)

      expect(playSoundSpy).toHaveBeenCalledTimes(1)
      expect(playSoundSpy.mock.calls[0]?.[0]).toMatchObject({ newValue: 2 })
      sonifier.dispose()
    })
  })

  describe('dispose', () => {
    it('cancels pending debounced cues and ignores later updates', async () => {
      vi.useFakeTimers()
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const sonifier = createSonifier({ enabled: true, debounceMs: 20 })

      sonifier.update({ count: 1 }, { count: 0 })
      sonifier.dispose()
      sonifier.update({ count: 2 }, { count: 1 })
      sonifier.play([change('count', 3, 2)])
      await vi.advanceTimersByTimeAsync(25)

      expect(playSoundSpy).not.toHaveBeenCalled()
    })

    it('stops cues that were scheduled before dispose', () => {
      const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
      const sonifier = createSonifier({ enabled: true })

      sonifier.update({ count: 1 }, { count: 0 })
      const playOptions = playSoundSpy.mock.calls[0]?.[1] as { isPlaybackActive: () => boolean }

      expect(playOptions.isPlaybackActive()).toBe(true)
      sonifier.dispose()
      expect(playOptions.isPlaybackActive()).toBe(false)
    })

    it('releases its engine reference exactly once', () => {
      const releaseSpy = vi.spyOn(audio, 'releaseAudioEngine')
      const sonifier = createSonifier({ enabled: true })

      sonifier.update({ count: 1 }, { count: 0 })
      sonifier.dispose()
      sonifier.dispose()

      expect(releaseSpy).toHaveBeenCalledTimes(1)
      expect(mockAudioContext.close).toHaveBeenCalledTimes(1)
    })

    it('keeps the shared engine open until every sonifier is disposed', () => {
      const first = createSonifier({ enabled: true })
      const second = createSonifier({ enabled: true })

      first.update({ count: 1 }, { count: 0 })
      first.dispose()
      second.update({ count: 1 }, { count: 0 })

      expect(window.AudioContext).toHaveBeenCalledTimes(1)
      expect(mockAudioContext.close).not.toHaveBeenCalled()

      second.dispose()
      expect(mockAudioContext.close).toHaveBeenCalledTimes(1)
    })
  })
})
