import { describe, expect, it } from 'vitest'
import { clamp01, lerp, midiToHz } from '../src/math'

describe('clamp01', () => {
  it('returns the value when within [0, 1]', () => {
    expect(clamp01(0.5)).toBe(0.5)
  })

  it('clamps values below 0 to 0', () => {
    expect(clamp01(-0.1)).toBe(0)
  })

  it('clamps values above 1 to 1', () => {
    expect(clamp01(1.5)).toBe(1)
  })

  it('returns 0 for exactly 0', () => {
    expect(clamp01(0)).toBe(0)
  })

  it('returns 1 for exactly 1', () => {
    expect(clamp01(1)).toBe(1)
  })
})

describe('lerp', () => {
  it('returns a when t is 0', () => {
    expect(lerp(10, 20, 0)).toBe(10)
  })

  it('returns b when t is 1', () => {
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('returns midpoint when t is 0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50)
  })
})

describe('midiToHz', () => {
  it('converts A4 (MIDI 69) to 440 Hz', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6)
  })

  it('converts A3 (MIDI 57) to 220 Hz', () => {
    expect(midiToHz(57)).toBeCloseTo(220, 6)
  })

  it('converts C4 (MIDI 60) to ~261.63 Hz', () => {
    expect(midiToHz(60)).toBeCloseTo(261.626, 2)
  })
})
