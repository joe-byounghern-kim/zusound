import { describe, expect, it, vi } from 'vitest'
import { createTimbreWave } from '../src/synthesis'

function createMockContext() {
  const createPeriodicWave = vi.fn((real: Float32Array, imag: Float32Array, options?: any) => ({
    real,
    imag,
    options,
  }))

  return { ctx: { createPeriodicWave } as unknown as AudioContext, createPeriodicWave }
}

describe('synthesis', () => {
  it('creates harmonic arrays sized numHarmonics + 1', () => {
    const { ctx, createPeriodicWave } = createMockContext()

    createTimbreWave(ctx, 0.7, 10)

    expect(createPeriodicWave).toHaveBeenCalledTimes(1)
    const [real, imag] = createPeriodicWave.mock.calls[0] as [Float32Array, Float32Array]
    expect(real.length).toBe(11)
    expect(imag.length).toBe(11)
  })

  it('caps harmonic count to avoid oversized waves', () => {
    const { ctx, createPeriodicWave } = createMockContext()

    createTimbreWave(ctx, 0.7, 1000)

    const [real, imag] = createPeriodicWave.mock.calls[0] as [Float32Array, Float32Array]
    expect(real.length).toBe(33)
    expect(imag.length).toBe(33)
  })

  it('reuses cached waves for identical params', () => {
    const { ctx, createPeriodicWave } = createMockContext()

    const waveA = createTimbreWave(ctx, 0.5, 10)
    const waveB = createTimbreWave(ctx, 0.5, 10)

    expect(waveA).toBe(waveB)
    expect(createPeriodicWave).toHaveBeenCalledTimes(1)
  })

  it('creates different waves for different keys', () => {
    const { ctx, createPeriodicWave } = createMockContext()

    const waveA = createTimbreWave(ctx, 0.5, 10)
    const waveB = createTimbreWave(ctx, 0.6, 10)

    expect(waveA).not.toBe(waveB)
    expect(createPeriodicWave).toHaveBeenCalledTimes(2)
  })

  it('reduces high-harmonic amplitude as brightness decreases', () => {
    const { ctx } = createMockContext()

    const bright = createTimbreWave(ctx, 1, 10) as any
    const dark = createTimbreWave(ctx, 0, 10) as any

    expect(dark.imag[10]).toBeLessThan(bright.imag[10])
  })
})
