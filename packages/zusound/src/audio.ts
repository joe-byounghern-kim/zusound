/**
 * Web Audio runtime.
 *
 * Lazy-initializes and reuses a single AudioContext, exposes `playSound()`
 * with ADSR envelope scheduling, and maps aesthetic controls into pitch,
 * interval, timbre, and timing. All playback failures are non-fatal.
 */

import type { AestheticParams, Change, SoundParams, ZusoundOptions } from './types'
import { MAX_HARMONICS } from './constants'
import { clamp01, lerp, midiToHz } from './math'
import { createTimbreWave } from './synthesis'
import { mapPleasantnessToIntervalContinuous } from './dissonance'
import { scheduleAudioTask, stopAudioScheduler } from './scheduler'

/** Shared AudioContext instance, lazily created on first playback. */
let audioContext: AudioContext | null = null

/** Reference count of active attachments (middleware + subscriber instances). */
let activeAttachmentCount = 0

/** Increment the audio engine reference count. */
export function retainAudioEngine(): void {
  activeAttachmentCount += 1
}

/** Decrement the reference count; close the AudioContext when it reaches zero. */
export function releaseAudioEngine(): void {
  if (activeAttachmentCount > 0) {
    activeAttachmentCount -= 1
  }

  if (activeAttachmentCount === 0) {
    cleanupAudio()
  }
}

/** Return the shared AudioContext, creating it lazily. Returns null in non-browser environments. */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      const ctor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!ctor) return null
      audioContext = new ctor()
    } catch (error) {
      console.debug('Zusound: Failed to create AudioContext', error)
      return null
    }
  }

  return audioContext
}

/** Stop the scheduler, close the AudioContext, and reset the reference count. */
export function cleanupAudio(): void {
  activeAttachmentCount = 0
  if (audioContext) {
    stopAudioScheduler(audioContext)
    if (audioContext.state !== 'closed') {
      audioContext.close()
    }
    audioContext = null
  }
}

type PlaySoundOptions = {
  globalVolume?: number
  aesthetics?: ZusoundOptions['aesthetics']
  mapChangeToAesthetics?: ZusoundOptions['mapChangeToAesthetics']
  soundMapping?: ZusoundOptions['soundMapping']
  performanceMode?: boolean
  onError?: ZusoundOptions['onError']
  startOffset?: number
}

/**
 * Generate baseline aesthetic parameters from a state change.
 *
 * Maps value types to pitch ranges and timbres, operation types to
 * pleasantness/valence shifts, and applies an FNV-1a hash of the change
 * path for a stable pitch offset (same path always produces the same
 * relative pitch, making repeated updates on the same key recognizable).
 */
function defaultAesthetics(change: Change): AestheticParams {
  let baseMidi = 57
  let brightness = 0.6
  let pleasantness = 0.7
  let arousal = 0.6
  let valence = 0.6
  let simultaneity = 1

  switch (change.valueType) {
    case 'boolean':
      baseMidi = 64
      brightness = 0.35
      arousal = 0.8
      break
    case 'number':
      baseMidi = 69
      brightness = 0.55
      break
    case 'string':
      baseMidi = 72
      brightness = 0.85
      valence = 0.7
      break
    case 'object':
    case 'array':
      baseMidi = 76
      brightness = 0.65
      simultaneity = 0.85
      break
  }

  switch (change.operation) {
    case 'add':
      baseMidi += 3
      pleasantness = 0.9
      valence = 0.8
      break
    case 'remove':
      baseMidi -= 3
      pleasantness = 0.35
      valence = 0.35
      arousal = 0.7
      break
    case 'update':
      break
  }

  // FNV-1a hash of the path string for a stable ±3 semitone pitch offset.
  // This gives each state key a recognizable pitch identity.
  const h = [...change.path].reduce((a, c) => ((a ^ c.charCodeAt(0)) * 16777619) >>> 0, 2166136261)
  baseMidi += (h % 7) - 3

  // Value-aware modulation: delta-driven pitch, arousal, and duration
  let duration: number | undefined = undefined

  if (change.valueType === 'number' && change.operation === 'update') {
    const oldNum = typeof change.oldValue === 'number' ? change.oldValue : 0
    const newNum = typeof change.newValue === 'number' ? change.newValue : 0
    const delta = newNum - oldNum
    const magnitude = clamp01(Math.abs(delta) / (Math.abs(oldNum) + 1))

    baseMidi += delta > 0 ? magnitude * 4 : -magnitude * 4
    arousal = lerp(0.4, 0.85, magnitude)
    duration = lerp(0.1, 0.28, magnitude)
  }

  if (change.valueType === 'array' && change.operation === 'update') {
    const oldLen = Array.isArray(change.oldValue) ? change.oldValue.length : 0
    const newLen = Array.isArray(change.newValue) ? change.newValue.length : 0
    const sizeRatio = clamp01(Math.abs(newLen - oldLen) / (oldLen + 1))

    arousal = lerp(0.5, 0.85, sizeRatio)
    duration = lerp(0.12, 0.22, sizeRatio)
  }

  if (change.valueType === 'boolean') {
    const goingTrue = change.newValue === true
    baseMidi += goingTrue ? 2 : -2
    duration = 0.09
  }

  return {
    pleasantness,
    brightness,
    arousal,
    valence,
    simultaneity,
    baseMidi,
    duration,
  }
}

/**
 * Merge aesthetic overrides onto a base set, applying each in order.
 * Only defined numeric fields are overridden; [0, 1] fields are clamped.
 */
function mergeAesthetics(
  base: AestheticParams,
  overrides: Array<Partial<AestheticParams> | undefined>
): AestheticParams {
  const merged: AestheticParams = { ...base }
  for (const override of overrides) {
    if (!override) continue
    if (typeof override.pleasantness === 'number') merged.pleasantness = override.pleasantness
    if (typeof override.brightness === 'number') merged.brightness = override.brightness
    if (typeof override.arousal === 'number') merged.arousal = override.arousal
    if (typeof override.valence === 'number') merged.valence = override.valence
    if (typeof override.simultaneity === 'number') merged.simultaneity = override.simultaneity
    if (typeof override.baseMidi === 'number') merged.baseMidi = override.baseMidi
    if (typeof override.duration === 'number') merged.duration = override.duration
  }

  merged.pleasantness = clamp01(merged.pleasantness)
  merged.brightness = clamp01(merged.brightness)
  merged.arousal = clamp01(merged.arousal)
  merged.valence = clamp01(merged.valence)
  merged.simultaneity = clamp01(merged.simultaneity)

  return merged
}

/**
 * Translate a `SoundParams` path override into aesthetic adjustments.
 * Waveform names are mapped to equivalent brightness and harmonic counts.
 * Duration is converted from milliseconds (SoundParams) to seconds.
 */
function applySoundMapping(
  aesthetics: AestheticParams,
  mapping: Partial<SoundParams> | undefined
): {
  aesthetics: AestheticParams
  baseFrequencyOverride?: number
  numHarmonicsOverride?: number
  durationOverride?: number
  volumeMultiplier?: number
} {
  if (!mapping) return { aesthetics }

  let numHarmonicsOverride: number | undefined
  const next: AestheticParams = { ...aesthetics }

  if (mapping.timbre) {
    next.brightness = mapping.timbre.brightness
    if (typeof mapping.timbre.numHarmonics === 'number')
      numHarmonicsOverride = mapping.timbre.numHarmonics
  } else if (mapping.waveform) {
    switch (mapping.waveform) {
      case 'sine':
        numHarmonicsOverride = 1
        break
      case 'triangle':
        next.brightness = 0.35
        numHarmonicsOverride = 9
        break
      case 'square':
        next.brightness = 0.5
        numHarmonicsOverride = 11
        break
      case 'sawtooth':
        next.brightness = 0.85
        numHarmonicsOverride = 13
        break
    }
  }

  next.brightness = clamp01(next.brightness)

  const durationOverride =
    typeof mapping.duration === 'number' ? mapping.duration / 1000 : undefined
  const volumeMultiplier =
    typeof mapping.volume === 'number' && Number.isFinite(mapping.volume)
      ? clamp01(mapping.volume)
      : undefined

  return {
    aesthetics: next,
    baseFrequencyOverride: typeof mapping.frequency === 'number' ? mapping.frequency : undefined,
    numHarmonicsOverride,
    durationOverride,
    volumeMultiplier,
  }
}

/**
 * Schedule an ADSR (Attack-Decay-Sustain-Release) gain envelope.
 * Arousal controls envelope speed; valence controls sustain level.
 */
function scheduleAdsr(params: {
  gain: AudioParam
  now: number
  durationSeconds: number
  peak: number
  arousal: number
  valence: number
}): void {
  const attack = lerp(0.03, 0.005, params.arousal)
  const decay = lerp(0.04, 0.01, params.arousal)
  const release = lerp(0.06, 0.015, params.arousal)
  const sustainLevel = lerp(0.35, 0.85, params.valence)

  const sustainTime = Math.max(0, params.durationSeconds - attack - decay - release)
  const t0 = params.now
  const t1 = t0 + attack
  const t2 = t1 + decay
  const t3 = t2 + sustainTime
  const t4 = t0 + params.durationSeconds

  params.gain.setValueAtTime(0, t0)
  params.gain.linearRampToValueAtTime(params.peak, t1)
  params.gain.linearRampToValueAtTime(params.peak * sustainLevel, t2)
  params.gain.setValueAtTime(params.peak * sustainLevel, t3)
  params.gain.linearRampToValueAtTime(0, t4)
}

/**
 * Render a short audio cue for a state change.
 *
 * Builds aesthetic parameters from the change, applies user overrides
 * and sound-mapping, computes dissonance-ranked interval, then schedules
 * a two-oscillator dyad with ADSR envelope through the shared AudioContext.
 */
export async function playSound(change: Change, globalVolume: number): Promise<void>
export async function playSound(change: Change, options?: PlaySoundOptions): Promise<void>
export async function playSound(
  change: Change,
  volumeOrOptions: number | PlaySoundOptions = 0.3
): Promise<void> {
  const ctx = getAudioContext()
  if (!ctx) return

  const globalVolume =
    typeof volumeOrOptions === 'number' ? volumeOrOptions : (volumeOrOptions.globalVolume ?? 0.3)
  const options = typeof volumeOrOptions === 'number' ? undefined : volumeOrOptions

  // Resume context if needed (for autoplay policies)
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch (error) {
      options?.onError?.(error, { stage: 'audio-resume', change })
      return
    }
  }

  if (ctx.state !== 'running') return

  const base = defaultAesthetics(change)
  const fromOptions = options?.aesthetics
  const fromHook = options?.mapChangeToAesthetics?.(change) ?? undefined
  const merged = mergeAesthetics(base, [fromOptions, fromHook])

  const soundOverride = options?.soundMapping?.[change.path]
  const mapped = applySoundMapping(merged, soundOverride)

  const numHarmonics = Math.min(
    MAX_HARMONICS,
    Math.max(1, Math.floor(mapped.numHarmonicsOverride ?? 10))
  )
  const baseFrequency =
    mapped.baseFrequencyOverride ?? midiToHz(mapped.aesthetics.baseMidi ?? base.baseMidi ?? 57)

  const intervalSemitones = mapPleasantnessToIntervalContinuous({
    pleasantness: mapped.aesthetics.pleasantness,
    brightness: mapped.aesthetics.brightness,
    numHarmonics,
    baseFrequency,
    performanceMode: options?.performanceMode,
  })

  const durationSeconds = Math.max(0.02, mapped.durationOverride ?? merged.duration ?? 0.15)
  const offsetSeconds =
    typeof volumeOrOptions === 'number' ? 0 : (volumeOrOptions?.startOffset ?? 0)
  const startTime = ctx.currentTime + 0.01 + offsetSeconds
  const spreadSeconds = (1 - mapped.aesthetics.simultaneity) * durationSeconds * 0.8

  scheduleAudioTask(ctx, startTime, () => {
    const baseStart = Math.max(startTime, ctx.currentTime + 0.001)
    const startA = baseStart
    const startB = baseStart + Math.max(0, spreadSeconds)

    const envelopeGain = ctx.createGain()
    envelopeGain.connect(ctx.destination)

    const peak = globalVolume * (mapped.volumeMultiplier ?? 1)

    scheduleAdsr({
      gain: envelopeGain.gain,
      now: baseStart,
      durationSeconds,
      peak,
      arousal: mapped.aesthetics.arousal,
      valence: mapped.aesthetics.valence,
    })

    const oscA = ctx.createOscillator()
    const oscB = ctx.createOscillator()
    const gainA = ctx.createGain()
    const gainB = ctx.createGain()

    gainA.gain.setValueAtTime(0.5, baseStart)
    gainB.gain.setValueAtTime(0.5, baseStart)

    const wave = createTimbreWave(ctx, mapped.aesthetics.brightness, numHarmonics)
    oscA.setPeriodicWave(wave)
    oscB.setPeriodicWave(wave)

    oscA.frequency.setValueAtTime(baseFrequency, baseStart)
    oscB.frequency.setValueAtTime(baseFrequency * Math.pow(2, intervalSemitones / 12), baseStart)

    oscA.connect(gainA)
    oscB.connect(gainB)
    gainA.connect(envelopeGain)
    gainB.connect(envelopeGain)

    const stopAt = baseStart + durationSeconds
    oscA.start(startA)
    oscB.start(startB)
    oscA.stop(stopAt)
    oscB.stop(stopAt)

    let ended = 0
    const safeDisconnect = (node: AudioNode) => {
      try {
        node.disconnect()
      } catch {
        // Disconnecting already-disconnected nodes is expected during cleanup
      }
    }

    const cleanup = () => {
      safeDisconnect(oscA)
      safeDisconnect(oscB)
      safeDisconnect(gainA)
      safeDisconnect(gainB)
      safeDisconnect(envelopeGain)
    }

    const onended = () => {
      ended += 1
      if (ended === 2) cleanup()
    }

    oscA.onended = onended
    oscB.onended = onended
  })
}
