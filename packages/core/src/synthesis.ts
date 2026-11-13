/**
 * PeriodicWave synthesis with per-AudioContext caching.
 *
 * Builds custom waveforms using harmonic series with brightness-controlled
 * spectral rolloff. Waves are cached by (brightness, numHarmonics) key
 * per AudioContext to avoid redundant FFT computation. The WeakMap keying
 * ensures cache entries are garbage-collected when the context is closed.
 */

import { MAX_HARMONICS } from './constants'
import { clamp01 } from './math'

/** Per-context wave cache. Keyed by AudioContext (weak) → cache-key string → PeriodicWave. */
const cacheByContext = new WeakMap<AudioContext, Map<string, PeriodicWave>>()

/** Quantize brightness to 3 decimal places for stable cache keys. */
function quantizeBrightness(brightness: number): number {
  const clamped = clamp01(brightness)
  return Math.round(clamped * 1000) / 1000
}

/** Get or create the wave cache for a given AudioContext. */
function getContextCache(ctx: AudioContext): Map<string, PeriodicWave> {
  const existing = cacheByContext.get(ctx)
  if (existing) return existing
  const created = new Map<string, PeriodicWave>()
  cacheByContext.set(ctx, created)
  return created
}

/**
 * Build a PeriodicWave from a harmonic amplitude function, returning
 * a cached instance if one already exists for the given key.
 */
function createWave(
  ctx: AudioContext,
  key: string,
  numHarmonics: number,
  amplitudeForHarmonic: (n: number) => number
): PeriodicWave {
  const cache = getContextCache(ctx)
  const cached = cache.get(key)
  if (cached) return cached

  const real = new Float32Array(numHarmonics + 1)
  const imag = new Float32Array(numHarmonics + 1)

  for (let n = 1; n <= numHarmonics; n++) {
    imag[n] = amplitudeForHarmonic(n)
  }

  const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false })
  cache.set(key, wave)
  return wave
}

/**
 * Create a PeriodicWave with brightness-controlled harmonic rolloff.
 *
 * Each harmonic's amplitude is `(1/n²) × attenuation`, where attenuation
 * decreases with `(1 − brightness) × 24 dB/octave` rolloff. Higher
 * brightness retains more upper harmonics, producing a brighter timbre.
 */
export function createTimbreWave(
  ctx: AudioContext,
  brightness: number,
  numHarmonics: number = 10
): PeriodicWave {
  const harmonics = Math.min(MAX_HARMONICS, Math.max(1, Math.floor(numHarmonics)))
  const safeBrightness = quantizeBrightness(brightness)
  const key = `timbre:${safeBrightness.toFixed(3)}:${harmonics}`
  const rolloffDbPerOct = (1 - safeBrightness) * 24

  return createWave(ctx, key, harmonics, (n) => {
    const octaves = Math.log2(n)
    const attenuation = Math.pow(10, -(rolloffDbPerOct * octaves) / 20)
    return (1 / (n * n)) * attenuation
  })
}
