import { describe, expect, it } from 'vitest'
import * as dissonance from '../src/dissonance'

describe('dissonance', () => {
  it('pairDissonance returns 0 when frequencies match', () => {
    expect(dissonance.pairDissonance(440, 440, 1, 1)).toBe(0)
  })

  it('interval dissonance is deterministic for fixed params', () => {
    const a = dissonance.intervalDissonance(220, 7, 0.5, 10)
    const b = dissonance.intervalDissonance(220, 7, 0.5, 10)
    expect(a).toBe(b)
  })

  it('ranks 12 chromatic intervals deterministically', () => {
    const r1 = dissonance.rankChromaticIntervals({
      baseFrequency: 220,
      brightness: 0.5,
      numHarmonics: 10,
    })
    const r2 = dissonance.rankChromaticIntervals({
      baseFrequency: 220,
      brightness: 0.5,
      numHarmonics: 10,
    })
    expect(r1).toEqual(r2)
    expect(r1).toHaveLength(12)
    expect(new Set(r1).size).toBe(12)
  })

  it('maps pleasantness extremes to most consonant and most dissonant intervals', () => {
    const params = { baseFrequency: 220, brightness: 0.5, numHarmonics: 10 }
    const ranking = dissonance.rankChromaticIntervals(params)

    expect(dissonance.mapPleasantnessToInterval({ ...params, pleasantness: 1 })).toBe(ranking[0])
    expect(dissonance.mapPleasantnessToInterval({ ...params, pleasantness: 0 })).toBe(
      ranking[ranking.length - 1]
    )
    expect(dissonance.mapPleasantnessToIntervalContinuous({ ...params, pleasantness: 1 })).toBe(
      ranking[0]
    )
    expect(dissonance.mapPleasantnessToIntervalContinuous({ ...params, pleasantness: 0 })).toBe(
      ranking[ranking.length - 1]
    )
  })

  it('interpolates pleasantness continuously to fractional semitone offsets', () => {
    const params = { baseFrequency: 220, brightness: 0.5, numHarmonics: 10 }
    const ranking = dissonance.rankChromaticIntervals(params)
    const mid = dissonance.mapPleasantnessToIntervalContinuous({ ...params, pleasantness: 0.5 })

    expect(Number.isFinite(mid)).toBe(true)
    expect(Number.isInteger(mid)).toBe(false)
    expect(mid).toBeGreaterThanOrEqual(Math.min(...ranking))
    expect(mid).toBeLessThanOrEqual(Math.max(...ranking))
  })

  it('supports performanceMode static fallback', () => {
    const params = {
      baseFrequency: 220,
      brightness: 0.5,
      numHarmonics: 10,
      performanceMode: true,
    }

    expect(dissonance.mapPleasantnessToInterval({ ...params, pleasantness: 1 })).toBe(0)
    expect(dissonance.mapPleasantnessToInterval({ ...params, pleasantness: 0 })).toBe(6)
    expect(
      dissonance.mapPleasantnessToIntervalContinuous({ ...params, pleasantness: 0.5 })
    ).toBeGreaterThanOrEqual(0)
  })

  it('changes dissonance when brightness changes', () => {
    const bright = dissonance.intervalDissonance(220, 7, 1, 10)
    const dark = dissonance.intervalDissonance(220, 7, 0, 10)
    expect(bright).not.toBe(dark)
  })

  it('memoizes chromatic interval ranking for identical params', () => {
    dissonance.clearIntervalRankingCache()
    expect(dissonance.getIntervalRankingCacheSize()).toBe(0)

    const params = { baseFrequency: 221, brightness: 0.51, numHarmonics: 10 }
    const a = dissonance.rankChromaticIntervals(params)
    expect(dissonance.getIntervalRankingCacheSize()).toBe(1)

    const b = dissonance.rankChromaticIntervals(params)
    expect(dissonance.getIntervalRankingCacheSize()).toBe(1)
    expect(b).toEqual(a)
  })

  it('caps harmonic count for performance safety', () => {
    const constrained = dissonance.rankChromaticIntervals({
      baseFrequency: 220,
      brightness: 0.5,
      numHarmonics: 32,
    })
    const oversized = dissonance.rankChromaticIntervals({
      baseFrequency: 220,
      brightness: 0.5,
      numHarmonics: 1000,
    })

    expect(oversized).toEqual(constrained)
  })

  it('bounds ranking cache size with eviction', () => {
    dissonance.clearIntervalRankingCache()

    for (let i = 0; i < 400; i++) {
      dissonance.rankChromaticIntervals({
        baseFrequency: 200 + i,
        brightness: 0.5,
        numHarmonics: 10,
      })
    }

    expect(dissonance.getIntervalRankingCacheSize()).toBeLessThanOrEqual(256)
  })
})
