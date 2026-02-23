/**
 * Interval ranking and roughness model.
 *
 * Uses a Sethares/Plomp-Levelt-inspired dyad roughness scoring system
 * to rank chromatic intervals by sensory dissonance. The ranking drives
 * the `pleasantness` aesthetic: high pleasantness selects consonant
 * intervals, low pleasantness selects dissonant ones.
 *
 * @see Sethares, W.A. (1993). "Local consonance and the relationship
 *      between timbre and scale." JASA 94(3).
 * @see Plomp, R. & Levelt, W.J.M. (1965). "Tonal consonance and
 *      critical bandwidth." JASA 38(4).
 */

import { MAX_HARMONICS } from './constants'
import { clamp01 } from './math'

/** A single harmonic partial with frequency and amplitude. */
type HarmonicPartial = {
  frequency: number
  amplitude: number
}

/*
 * Plomp-Levelt roughness model constants.
 *
 * DSTAR - Critical bandwidth scaling factor
 * S1, S2 - Frequency-dependent bandwidth regression coefficients
 * C1, C2 - Amplitude weighting constants (sum to zero for baseline normalization)
 * A1, A2 - Exponential decay rates for the roughness curve
 */
const DSTAR = 0.24
const S1 = 0.0207
const S2 = 18.96
const C1 = 5
const C2 = -5
const A1 = -3.51
const A2 = -5.75

/** Round a value to the nearest step for cache key stability. */
function quantize(value: number, step: number): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

/**
 * Build the harmonic series for a given base frequency and brightness.
 * Each partial's amplitude decays with an inverse-square law, further
 * attenuated by a brightness-controlled rolloff in dB per octave.
 */
function buildPartials(
  baseFrequency: number,
  brightness: number,
  numHarmonics: number
): HarmonicPartial[] {
  const safeBrightness = clamp01(brightness)
  const harmonics = Math.min(MAX_HARMONICS, Math.max(1, Math.floor(numHarmonics)))
  const rolloffDbPerOct = (1 - safeBrightness) * 24

  const partials: HarmonicPartial[] = []
  for (let n = 1; n <= harmonics; n++) {
    const octaves = Math.log2(n)
    const attenuation = Math.pow(10, -(rolloffDbPerOct * octaves) / 20)
    partials.push({
      frequency: baseFrequency * n,
      amplitude: (1 / (n * n)) * attenuation,
    })
  }

  return partials
}

/** Compute sensory roughness between two frequency/amplitude pairs. */
export function pairDissonance(f1: number, f2: number, a1: number, a2: number): number {
  const fmin = Math.min(f1, f2)
  const s = DSTAR / (S1 * fmin + S2)
  const fdif = Math.abs(f2 - f1)
  return Math.min(a1, a2) * (C1 * Math.exp(A1 * s * fdif) + C2 * Math.exp(A2 * s * fdif))
}

/** Parameters for interval ranking computation. */
export type IntervalRankingParams = {
  baseFrequency?: number
  brightness: number
  numHarmonics: number
  performanceMode?: boolean
}

/**
 * Pre-computed consonance ranking (unison through tritone) for
 * `performanceMode`, ordered from most consonant to most dissonant.
 */
const staticConsonanceRanking: number[] = [0, 7, 5, 4, 3, 9, 8, 2, 10, 11, 1, 6]

const rankingCache = new Map<string, number[]>()
const MAX_RANKING_CACHE_ENTRIES = 256

/** Insert a ranking into the cache, evicting the oldest entry if full. */
function setRankingCache(key: string, ranking: number[]): void {
  if (rankingCache.has(key)) {
    rankingCache.set(key, ranking)
    return
  }

  if (rankingCache.size >= MAX_RANKING_CACHE_ENTRIES) {
    const oldestKey = rankingCache.keys().next().value
    if (oldestKey) rankingCache.delete(oldestKey)
  }

  rankingCache.set(key, ranking)
}

/**
 * Compute total sensory dissonance for a chromatic interval.
 * Sums pairwise roughness across all harmonic partials of both tones.
 */
export function intervalDissonance(
  baseFrequency: number,
  semitones: number,
  brightness: number,
  numHarmonics: number
): number {
  const f1 = baseFrequency
  const f2 = baseFrequency * Math.pow(2, semitones / 12)
  const p1 = buildPartials(f1, brightness, numHarmonics)
  const p2 = buildPartials(f2, brightness, numHarmonics)

  let sum = 0
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      sum += pairDissonance(p1[i].frequency, p2[j].frequency, p1[i].amplitude, p2[j].amplitude)
    }
  }

  return sum
}

/**
 * Rank the 12 chromatic intervals by dissonance for the given timbre.
 * Returns interval semitones ordered from most consonant to most dissonant.
 * Results are cached by quantized (baseFrequency, brightness, numHarmonics).
 */
export function rankChromaticIntervals(params: IntervalRankingParams): number[] {
  const baseFrequency = params.baseFrequency ?? 220
  if (params.performanceMode) return staticConsonanceRanking.slice()

  const brightnessQ = quantize(clamp01(params.brightness), 0.001)
  const harmonics = Math.min(MAX_HARMONICS, Math.max(1, Math.floor(params.numHarmonics)))
  const baseQ = quantize(baseFrequency, 0.1)
  const key = `${baseQ.toFixed(1)}:${brightnessQ.toFixed(3)}:${harmonics}`

  const cached = rankingCache.get(key)
  if (cached) return cached.slice()

  const scored: Array<{ interval: number; dissonance: number }> = []
  for (let semitones = 0; semitones < 12; semitones++) {
    scored.push({
      interval: semitones,
      dissonance: intervalDissonance(baseFrequency, semitones, brightnessQ, harmonics),
    })
  }

  scored.sort((a, b) => a.dissonance - b.dissonance)
  const ranking = scored.map((s) => s.interval)
  setRankingCache(key, ranking)
  return ranking.slice()
}

/** Map a pleasantness value to a discrete interval (nearest semitone). */
export function mapPleasantnessToInterval(
  params: IntervalRankingParams & { pleasantness: number }
): number {
  const pleasantness = clamp01(params.pleasantness)
  const ranking = rankChromaticIntervals(params)
  const index = Math.round((1 - pleasantness) * (ranking.length - 1))
  return ranking[index]
}

/** Map a pleasantness value to a continuous interval (fractional semitones). */
export function mapPleasantnessToIntervalContinuous(
  params: IntervalRankingParams & { pleasantness: number }
): number {
  const pleasantness = clamp01(params.pleasantness)
  const ranking = rankChromaticIntervals(params)
  const position = (1 - pleasantness) * (ranking.length - 1)
  const index = Math.floor(position)
  const t = position - index

  if (index >= ranking.length - 1) return ranking[ranking.length - 1]

  const a = ranking[index]
  const b = ranking[index + 1]
  return a + (b - a) * t
}

/** Clear the interval ranking cache. Intended for testing. */
export function clearIntervalRankingCache(): void {
  rankingCache.clear()
}

/** Return the current size of the interval ranking cache. Intended for testing. */
export function getIntervalRankingCacheSize(): number {
  return rankingCache.size
}
