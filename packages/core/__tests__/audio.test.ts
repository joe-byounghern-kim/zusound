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
      sampleRate: 48000,
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

  it('does not reject when a resume diagnostic callback throws', async () => {
    const { ctx } = setupMockAudioContext()
    ctx.state = 'suspended'
    ctx.resume = vi.fn().mockRejectedValue(new Error('blocked'))
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const onError = vi.fn(() => {
      throw new Error('telemetry failed')
    })

    try {
      await expect(
        playSound(
          {
            path: 'count',
            operation: 'update',
            valueType: 'number',
            newValue: 1,
            oldValue: 0,
          },
          { onError }
        )
      ).resolves.toBeUndefined()
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ stage: 'audio-resume' })
      )
    } finally {
      debugSpy.mockRestore()
    }
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

  it('drops suspended cues even when resume succeeds immediately', async () => {
    const { ctx, oscillators } = setupMockAudioContext()
    ctx.state = 'suspended'
    ctx.resume = vi.fn().mockImplementation(async () => {
      ctx.state = 'running'
    })

    const change = {
      path: 'count',
      operation: 'update' as const,
      valueType: 'number' as const,
      newValue: 2,
      oldValue: 1,
    }
    await playSound(change)

    expect(ctx.resume).toHaveBeenCalledTimes(1)
    expect(oscillators).toHaveLength(0)

    await playSound({ ...change, newValue: 3, oldValue: 2 })
    expect(oscillators).toHaveLength(2)
  })

  it('never replays a backlog when a shared pending resume finally settles', async () => {
    const { ctx, oscillators } = setupMockAudioContext()
    ctx.state = 'suspended'
    let finishResume!: () => void
    ctx.resume = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishResume = resolve
        })
    )
    const pending = Array.from({ length: 60 }, (_, i) =>
      playSound({
        path: 'count',
        operation: 'update',
        valueType: 'number',
        oldValue: i,
        newValue: i + 1,
      })
    )

    expect(ctx.resume).toHaveBeenCalledTimes(1)
    expect(oscillators).toHaveLength(0)
    await Promise.all(pending)

    ctx.state = 'running'
    finishResume()
    await Promise.resolve()
    await Promise.resolve()
    expect(oscillators).toHaveLength(0)

    await playSound({
      path: 'count',
      operation: 'update',
      valueType: 'number',
      oldValue: 60,
      newValue: 61,
    })
    expect(oscillators).toHaveLength(2)
  })

  it('can retry a rejected resume attempt on a later update', async () => {
    const { ctx, oscillators } = setupMockAudioContext()
    ctx.state = 'suspended'
    ctx.resume.mockRejectedValueOnce(new Error('blocked'))
    const onError = vi.fn()
    const change = {
      path: 'count',
      operation: 'update' as const,
      valueType: 'number' as const,
      oldValue: 0,
      newValue: 1,
    }

    await playSound(change, { onError })
    await playSound(change, { onError })

    expect(ctx.resume).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(oscillators).toHaveLength(0)
  })

  it('does not schedule stale cues after cleanup while resume is pending', async () => {
    const old = setupMockAudioContext()
    old.ctx.state = 'suspended'
    let finishResume!: () => void
    old.ctx.resume = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishResume = resolve
        })
    )
    const change = {
      path: 'count',
      operation: 'update' as const,
      valueType: 'number' as const,
      oldValue: 0,
      newValue: 1,
    }
    const pending = playSound(change)
    cleanupAudio()
    const fresh = setupMockAudioContext()
    old.ctx.state = 'running'
    finishResume()
    await pending
    await Promise.resolve()
    expect(old.oscillators).toHaveLength(0)

    await playSound(change)
    expect(fresh.oscillators).toHaveLength(2)
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

  it('clamps soundMapping volume to the 0..1 range', async () => {
    const high = setupMockAudioContext()
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
            volume: 2,
          },
        },
      }
    )

    const highEnvelope = high.gains[0]
    const highPeakCall = highEnvelope.gain.linearRampToValueAtTime.mock.calls[0]
    expect(highPeakCall[0]).toBeCloseTo(0.6, 6)

    cleanupAudio()

    const low = setupMockAudioContext()
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
            volume: -1,
          },
        },
      }
    )

    const lowEnvelope = low.gains[0]
    const lowPeakCall = lowEnvelope.gain.linearRampToValueAtTime.mock.calls[0]
    expect(lowPeakCall[0]).toBeCloseTo(0, 6)
  })

  it('ignores non-finite soundMapping volume and falls back to global volume', async () => {
    const { gains } = setupMockAudioContext()

    await playSound(
      {
        path: 'count',
        operation: 'update',
        valueType: 'number',
        newValue: 2,
        oldValue: 1,
      },
      {
        globalVolume: 0.4,
        soundMapping: {
          count: {
            volume: Number.NaN,
          },
        },
      }
    )

    const envelopeGain = gains[0]
    const peakCall = envelopeGain.gain.linearRampToValueAtTime.mock.calls[0]
    expect(peakCall[0]).toBeCloseTo(0.4, 6)
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

  it.each(['development', 'production'])(
    'warns about corrected volume only in development (%s)',
    async (environment) => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      vi.stubEnv('NODE_ENV', environment)
      try {
        const run = setupMockAudioContext()
        await playSound(
          { path: 'count', operation: 'update', valueType: 'number', oldValue: 0, newValue: 1 },
          { globalVolume: 5 }
        )
        expect(run.gains[0].gain.linearRampToValueAtTime.mock.calls[0]?.[0]).toBe(1)
        expect(warning).toHaveBeenCalledTimes(environment === 'development' ? 1 : 0)
      } finally {
        vi.unstubAllEnvs()
        warning.mockRestore()
      }
    }
  )

  function expectFiniteCue(run: ReturnType<typeof setupMockAudioContext>) {
    expect(run.oscillators).toHaveLength(2)
    for (const oscillator of run.oscillators) {
      for (const args of [
        ...oscillator.frequency.setValueAtTime.mock.calls,
        ...oscillator.start.mock.calls,
        ...oscillator.stop.mock.calls,
      ]) {
        expect(args.every((value) => typeof value === 'number' && Number.isFinite(value))).toBe(
          true
        )
      }
    }
    for (const gain of run.gains) {
      for (const args of [
        ...gain.gain.setValueAtTime.mock.calls,
        ...gain.gain.linearRampToValueAtTime.mock.calls,
      ]) {
        expect(args.every((value) => typeof value === 'number' && Number.isFinite(value))).toBe(
          true
        )
      }
    }
  }

  it.each([
    [0, NaN],
    [NaN, 1],
    [Infinity, Infinity],
    [-Infinity, 1],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
  ])('schedules finite parameters for numeric state %s -> %s', async (oldValue, newValue) => {
    const run = setupMockAudioContext()
    await playSound({ path: 'count', operation: 'update', valueType: 'number', oldValue, newValue })
    expectFiniteCue(run)
  })

  it.each([
    [5, 1],
    [-1, 0],
    [NaN, 0.3],
    [Infinity, 0.3],
  ])('sanitizes global volume %s to %s', async (globalVolume, expected) => {
    const run = setupMockAudioContext()
    await playSound(
      { path: 'count', operation: 'update', valueType: 'number', oldValue: 0, newValue: 1 },
      { globalVolume }
    )
    expectFiniteCue(run)
    expect(run.gains[0].gain.linearRampToValueAtTime.mock.calls[0]?.[0]).toBe(expected)
  })

  it.each([NaN, Infinity, -Infinity])(
    'ignores non-finite aesthetics and sound mapping values (%s)',
    async (invalid) => {
      const run = setupMockAudioContext()
      await playSound(
        { path: 'count', operation: 'update', valueType: 'number', oldValue: 0, newValue: 1 },
        {
          aesthetics: {
            pleasantness: invalid,
            brightness: invalid,
            arousal: invalid,
            valence: invalid,
            simultaneity: invalid,
            baseMidi: invalid,
            duration: invalid,
          },
          soundMapping: {
            count: {
              frequency: invalid,
              duration: invalid,
              timbre: { brightness: invalid, numHarmonics: invalid },
            },
          },
        }
      )
      expectFiniteCue(run)
      const wave = run.ctx.createPeriodicWave.mock.calls[0] as unknown as [
        Float32Array,
        Float32Array,
      ]
      expect(wave[1].length).toBeGreaterThan(1)
      expect([...wave[1]].every(Number.isFinite)).toBe(true)
    }
  )

  it.each([0, -100, 100000])(
    'bounds both oscillator frequencies to 20 Hz through Nyquist (%s)',
    async (frequency) => {
      const run = setupMockAudioContext()
      await playSound(
        { path: 'count', operation: 'update', valueType: 'number', oldValue: 0, newValue: 1 },
        {
          soundMapping: { count: { frequency } },
        }
      )
      expectFiniteCue(run)
      for (const oscillator of run.oscillators) {
        const value = oscillator.frequency.setValueAtTime.mock.calls[0]?.[0] as number
        expect(value).toBeGreaterThanOrEqual(20)
        expect(value).toBeLessThanOrEqual(run.ctx.sampleRate / 2)
      }
    }
  )

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
