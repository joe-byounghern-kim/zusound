import { describe, expect, it, vi, beforeEach } from 'vitest'
import { playSound, cleanupAudio } from '../src/audio'

type GainNodeMock = {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>
    linearRampToValueAtTime: ReturnType<typeof vi.fn>
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>
    value?: number
  }
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

type OscillatorMock = {
  frequency: { setValueAtTime: ReturnType<typeof vi.fn> }
  setPeriodicWave: ReturnType<typeof vi.fn>
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  onended: ((this: unknown, ev: Event) => unknown) | null
}

describe('audio playback', () => {
  beforeEach(() => {
    cleanupAudio()
    ;(globalThis as any).window ??= globalThis
  })

  function setupMockAudioContext() {
    const oscillators: OscillatorMock[] = []
    const gains: GainNodeMock[] = []

    const createOscillator = vi.fn(() => {
      const osc: OscillatorMock = {
        frequency: { setValueAtTime: vi.fn() },
        setPeriodicWave: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      }
      oscillators.push(osc)
      return osc as unknown as OscillatorNode
    })

    const createGain = vi.fn(() => {
      const setValueAtTime = vi.fn()
      const linearRampToValueAtTime = vi.fn()
      const exponentialRampToValueAtTime = vi.fn()

      const gainParam: GainNodeMock['gain'] = {
        setValueAtTime,
        linearRampToValueAtTime,
        exponentialRampToValueAtTime,
      }

      Object.defineProperty(gainParam, 'value', {
        configurable: true,
        enumerable: true,
        get() {
          return undefined
        },
        set() {
          throw new Error('gain.value must not be assigned')
        },
      })

      const node: GainNodeMock = {
        gain: gainParam,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      gains.push(node)
      return node as unknown as GainNode
    })

    const ctx = {
      state: 'running',
      currentTime: 0,
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      destination: {},
      createOscillator,
      createGain,
      createPeriodicWave: vi.fn(() => ({}) as PeriodicWave),
    }

    const AudioContextCtor = vi.fn(function () {
      return ctx
    })

    Object.defineProperty(window, 'AudioContext', {
      writable: true,
      value: AudioContextCtor,
    })

    return { ctx, oscillators, gains, AudioContextCtor, createGain }
  }

  function midiToHz(midi: number): number {
    return 440 * 2 ** ((midi - 69) / 12)
  }

  it('uses simultaneity=1 to start both oscillators together', async () => {
    const { oscillators, gains } = setupMockAudioContext()

    await playSound(
      {
        path: 'count',
        operation: 'update',
        valueType: 'number',
        newValue: 1,
        oldValue: 0,
      },
      {
        globalVolume: 0.5,
        aesthetics: {
          pleasantness: 0.8,
          brightness: 0.6,
          arousal: 0.6,
          valence: 0.6,
          simultaneity: 1,
          baseMidi: 69,
        },
      }
    )

    expect(oscillators).toHaveLength(2)
    expect(oscillators[0].start).toHaveBeenCalledTimes(1)
    expect(oscillators[1].start).toHaveBeenCalledTimes(1)

    const startA = oscillators[0].start.mock.calls[0]?.[0] as number
    const startB = oscillators[1].start.mock.calls[0]?.[0] as number
    expect(startB).toBeCloseTo(startA, 6)

    const envelopeGain = gains[0]
    expect(envelopeGain.gain.setValueAtTime).toHaveBeenCalled()
    expect(envelopeGain.gain.linearRampToValueAtTime).toHaveBeenCalled()
    expect(envelopeGain.gain.setValueAtTime.mock.invocationCallOrder[0]).toBeLessThan(
      envelopeGain.gain.linearRampToValueAtTime.mock.invocationCallOrder[0]
    )
  })

  it('uses simultaneity=0 to spread dyad onset across 80% of duration', async () => {
    const { oscillators } = setupMockAudioContext()

    await playSound(
      {
        path: 'count',
        operation: 'update',
        valueType: 'number',
        newValue: 1,
        oldValue: 0,
      },
      {
        globalVolume: 0.5,
        aesthetics: {
          pleasantness: 0.8,
          brightness: 0.6,
          arousal: 0.6,
          valence: 0.6,
          simultaneity: 0,
          baseMidi: 69,
          duration: 0.15,
        },
      }
    )

    const startA = oscillators[0].start.mock.calls[0]?.[0] as number
    const startB = oscillators[1].start.mock.calls[0]?.[0] as number
    const spread = startB - startA

    expect(spread).toBeCloseTo(0.15 * 0.8, 6)
  })

  it('reports resume failures through onError hook', async () => {
    const { ctx } = setupMockAudioContext()
    ctx.state = 'suspended'
    ctx.resume = vi.fn().mockRejectedValue(new Error('blocked'))

    const onError = vi.fn()

    await playSound(
      {
        path: 'count',
        operation: 'update',
        valueType: 'number',
        newValue: 1,
        oldValue: 0,
      },
      {
        globalVolume: 0.5,
        onError,
      }
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]?.[1]).toEqual({
      stage: 'audio-resume',
      change: {
        path: 'count',
        operation: 'update',
        valueType: 'number',
        newValue: 1,
        oldValue: 0,
      },
    })
  })

  it('recreates audio context after cleaning up a previously closed context', async () => {
    const closedRun = setupMockAudioContext()
    closedRun.ctx.state = 'closed'

    const change = {
      path: 'count',
      operation: 'update' as const,
      valueType: 'number' as const,
      newValue: 1,
      oldValue: 0,
    }

    await playSound(change, { globalVolume: 0.5 })
    expect(closedRun.AudioContextCtor).toHaveBeenCalledTimes(1)
    expect(closedRun.oscillators).toHaveLength(0)

    cleanupAudio()

    const runningRun = setupMockAudioContext()
    runningRun.ctx.state = 'running'

    await playSound(change, { globalVolume: 0.5 })
    expect(runningRun.AudioContextCtor).toHaveBeenCalledTimes(1)
    expect(runningRun.oscillators).toHaveLength(2)
  })

  it('applies global aesthetics overrides', async () => {
    const { oscillators } = setupMockAudioContext()

    await playSound(
      {
        path: 'status',
        operation: 'update',
        valueType: 'string',
        newValue: 'ready',
        oldValue: 'idle',
      },
      {
        aesthetics: {
          pleasantness: 0.2,
          brightness: 0.9,
          arousal: 0.8,
          valence: 0.4,
          simultaneity: 0.1,
          baseMidi: 72,
        },
      }
    )

    expect(oscillators).toHaveLength(2)
  })

  it('calls mapChangeToAesthetics and applies returned values', async () => {
    const { oscillators } = setupMockAudioContext()
    const change = {
      path: 'count',
      operation: 'update' as const,
      valueType: 'number' as const,
      newValue: 5,
      oldValue: 4,
    }
    const mapChangeToAesthetics = vi.fn(() => ({
      baseMidi: 81,
      simultaneity: 0,
      brightness: 0.4,
      duration: 0.22,
    }))

    await playSound(change, { mapChangeToAesthetics })

    expect(mapChangeToAesthetics).toHaveBeenCalledTimes(1)
    expect(mapChangeToAesthetics).toHaveBeenCalledWith(change)
    const baseFrequency = oscillators[0].frequency.setValueAtTime.mock.calls[0]?.[0] as number
    expect(baseFrequency).toBeCloseTo(midiToHz(81), 6)
    const startA = oscillators[0].start.mock.calls[0]?.[0] as number
    const startB = oscillators[1].start.mock.calls[0]?.[0] as number
    expect(startB - startA).toBeCloseTo(0.22 * 0.8, 6)
  })

  it('applies soundMapping path override values', async () => {
    const { oscillators, ctx } = setupMockAudioContext()

    await playSound(
      {
        path: 'count',
        operation: 'update',
        valueType: 'number',
        newValue: 2,
        oldValue: 1,
      },
      {
        soundMapping: {
          count: {
            frequency: 330,
            waveform: 'square',
          },
        },
      }
    )

    expect(oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(330, expect.any(Number))
    expect(ctx.createPeriodicWave).toHaveBeenCalled()
  })

  it('covers add operation default aesthetics branch', async () => {
    const { oscillators } = setupMockAudioContext()

    await playSound({
      path: 'items',
      operation: 'add',
      valueType: 'array',
      newValue: [1],
      oldValue: [],
    })

    expect(oscillators).toHaveLength(2)
  })

  it('covers remove operation default aesthetics branch', async () => {
    const { oscillators } = setupMockAudioContext()

    await playSound({
      path: 'items',
      operation: 'remove',
      valueType: 'array',
      newValue: [],
      oldValue: [1],
    })

    expect(oscillators).toHaveLength(2)
  })

  it('resumes suspended AudioContext before playback', async () => {
    const { ctx, oscillators } = setupMockAudioContext()
    ctx.state = 'suspended'
    ctx.resume = vi.fn().mockImplementation(async () => {
      ctx.state = 'running'
    })

    await playSound({
      path: 'count',
      operation: 'update',
      valueType: 'number',
      newValue: 2,
      oldValue: 1,
    })

    expect(ctx.resume).toHaveBeenCalledTimes(1)
    expect(oscillators).toHaveLength(2)
  })

  it('applies soundMapping duration and volume overrides', async () => {
    const { oscillators, gains } = setupMockAudioContext()

    await playSound(
      {
        path: 'count',
        operation: 'update',
        valueType: 'number',
        newValue: 2,
        oldValue: 1,
      },
      {
        globalVolume: 0.6,
        soundMapping: {
          count: {
            duration: 300,
            volume: 0.5,
          },
        },
      }
    )

    expect(oscillators).toHaveLength(2)

    // duration: 300ms → 0.3s; stopAt = baseStart + 0.3
    const startA = oscillators[0].start.mock.calls[0]?.[0] as number
    const stopAt = oscillators[0].stop.mock.calls[0]?.[0] as number
    expect(stopAt - startA).toBeCloseTo(0.3, 4)

    // volume: peak = 0.6 * 0.5 = 0.3
    const envelopeGain = gains[0]
    const peakCall = envelopeGain.gain.linearRampToValueAtTime.mock.calls[0]
    expect(peakCall[0]).toBeCloseTo(0.3, 6)
  })

  it('produces stable baseMidi offset from change.path', async () => {
    const run1 = setupMockAudioContext()
    await playSound({
      path: 'score',
      operation: 'update',
      valueType: 'number',
      newValue: 10,
      oldValue: 5,
    })
    const freq1 = run1.oscillators[0].frequency.setValueAtTime.mock.calls[0]?.[0] as number

    cleanupAudio()
    const run2 = setupMockAudioContext()
    await playSound({
      path: 'score',
      operation: 'update',
      valueType: 'number',
      newValue: 10,
      oldValue: 5,
    })
    const freq2 = run2.oscillators[0].frequency.setValueAtTime.mock.calls[0]?.[0] as number

    // Same path → same frequency
    expect(freq1).toBeCloseTo(freq2, 6)

    cleanupAudio()
    const run3 = setupMockAudioContext()
    await playSound({
      path: 'health',
      operation: 'update',
      valueType: 'number',
      newValue: 10,
      oldValue: 5,
    })
    const freq3 = run3.oscillators[0].frequency.setValueAtTime.mock.calls[0]?.[0] as number

    // Different path → different frequency
    expect(freq3).not.toBeCloseTo(freq1, 1)
  })

  it('modulates duration and pitch based on numeric delta magnitude', async () => {
    // Small delta
    const small = setupMockAudioContext()
    await playSound({
      path: 'val',
      operation: 'update',
      valueType: 'number',
      newValue: 101,
      oldValue: 100,
    })
    const smallStart = small.oscillators[0].start.mock.calls[0]?.[0] as number
    const smallStop = small.oscillators[0].stop.mock.calls[0]?.[0] as number
    const smallDuration = smallStop - smallStart
    const smallFreq = small.oscillators[0].frequency.setValueAtTime.mock.calls[0]?.[0] as number

    cleanupAudio()

    // Large delta
    const large = setupMockAudioContext()
    await playSound({
      path: 'val',
      operation: 'update',
      valueType: 'number',
      newValue: 100,
      oldValue: 0,
    })
    const largeStart = large.oscillators[0].start.mock.calls[0]?.[0] as number
    const largeStop = large.oscillators[0].stop.mock.calls[0]?.[0] as number
    const largeDuration = largeStop - largeStart
    const largeFreq = large.oscillators[0].frequency.setValueAtTime.mock.calls[0]?.[0] as number

    // Large delta → longer duration
    expect(largeDuration).toBeGreaterThan(smallDuration)
    // Positive delta → higher pitch
    expect(largeFreq).toBeGreaterThan(smallFreq)
  })

  it('shifts pitch up for true and down for false boolean changes', async () => {
    const runTrue = setupMockAudioContext()
    await playSound({
      path: 'flag',
      operation: 'update',
      valueType: 'boolean',
      newValue: true,
      oldValue: false,
    })
    const freqTrue = runTrue.oscillators[0].frequency.setValueAtTime.mock.calls[0]?.[0] as number
    const stopTrue = runTrue.oscillators[0].stop.mock.calls[0]?.[0] as number
    const startTrue = runTrue.oscillators[0].start.mock.calls[0]?.[0] as number

    cleanupAudio()

    const runFalse = setupMockAudioContext()
    await playSound({
      path: 'flag',
      operation: 'update',
      valueType: 'boolean',
      newValue: false,
      oldValue: true,
    })
    const freqFalse = runFalse.oscillators[0].frequency.setValueAtTime.mock.calls[0]?.[0] as number

    // true → higher pitch, false → lower pitch
    expect(freqTrue).toBeGreaterThan(freqFalse)
    // Snappy duration ~0.09s
    expect(stopTrue - startTrue).toBeCloseTo(0.09, 4)
  })

  it('applies startOffset to delay sound scheduling', async () => {
    const { oscillators, ctx } = setupMockAudioContext()
    ctx.currentTime = 1.0

    await playSound(
      {
        path: 'x',
        operation: 'update',
        valueType: 'number',
        newValue: 2,
        oldValue: 1,
      },
      {
        startOffset: 0.08,
      }
    )

    const startA = oscillators[0].start.mock.calls[0]?.[0] as number
    // startTime = ctx.currentTime(1.0) + 0.01 + 0.08 = 1.09
    expect(startA).toBeCloseTo(1.09, 4)
  })
})
