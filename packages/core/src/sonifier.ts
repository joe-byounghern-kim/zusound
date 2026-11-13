/**
 * Sonifier orchestration.
 *
 * Connects the differ to the audio runtime: resolves default enablement,
 * debounces bursts of changes, staggers cue onsets within a batch, and owns
 * one reference to the shared audio engine for its lifetime.
 */

import type { Change, Sonifier, SonifierOptions } from './types'
import { playSound, releaseAudioEngine, retainAudioEngine } from './audio'
import { createChangeBuffer } from './changes'
import { MAX_STAGGER_SECONDS, STAGGER_SECONDS } from './constants'
import { detectChanges } from './differ'
import { resolveDefaultEnabled } from './env'
import { reportError } from './errors'

// A Record keeps this list exhaustive: adding an option without listing it fails to compile.
const optionKeyRecord: Record<keyof SonifierOptions, true> = {
  enabled: true,
  volume: true,
  debounceMs: true,
  soundMapping: true,
  aesthetics: true,
  mapChangeToAesthetics: true,
  performanceMode: true,
  onError: true,
}

/** Every option key `createSonifier()` recognizes. */
export const sonifierOptionKeys: readonly (keyof SonifierOptions)[] = Object.freeze(
  Object.keys(optionKeyRecord) as (keyof SonifierOptions)[]
)

const knownOptionKeys: ReadonlySet<string> = new Set(sonifierOptionKeys)

/** Diagnose option typos using the shared environment detection, not explicit audio enablement. */
function warnUnknownOptions(options: SonifierOptions): void {
  if (!resolveDefaultEnabled()) return

  const unknownKeys = Object.keys(options).filter((key) => !knownOptionKeys.has(key))
  if (unknownKeys.length > 0) {
    console.warn(`Zusound: Unknown option keys: ${unknownKeys.join(', ')}`)
  }
}

const noop = () => {}

const disabledSonifier: Sonifier = Object.freeze({
  enabled: false,
  update: noop,
  play: noop,
  dispose: noop,
})

/**
 * Create a sonifier that turns state changes into short audio cues.
 *
 * `enabled` defaults to on in development and off in production. An enabled
 * sonifier holds a reference to the shared audio engine until `dispose()`.
 */
export function createSonifier(options: SonifierOptions = {}): Sonifier {
  warnUnknownOptions(options)

  const {
    enabled = resolveDefaultEnabled(),
    volume = 0.3,
    debounceMs = 0,
    soundMapping,
    aesthetics,
    mapChangeToAesthetics,
    performanceMode,
    onError,
  } = options

  if (!enabled) return disabledSonifier

  retainAudioEngine()

  let disposed = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const pendingChanges = createChangeBuffer()
  const isPlaybackActive = () => !disposed

  /** Play one batch, staggering onset times so simultaneous changes stay distinguishable. */
  const emit = (changes: readonly Change[]) => {
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i]
      playSound(change, {
        globalVolume: volume,
        soundMapping,
        aesthetics,
        mapChangeToAesthetics,
        performanceMode,
        onError,
        startOffset: Math.min(i * STAGGER_SECONDS, MAX_STAGGER_SECONDS),
        isPlaybackActive,
      }).catch((error) => {
        reportError(error, { stage: 'playback', change }, onError)
        console.debug('Zusound: Audio playback failed', error)
      })
    }
  }

  const play = (changes: readonly Change[]) => {
    if (disposed) return

    if (debounceMs > 0) {
      pendingChanges.add(changes)

      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (disposed) return
        const flushed = pendingChanges.flush()
        debounceTimer = null
        emit(flushed)
      }, debounceMs)
    } else {
      emit(changes)
    }
  }

  const update = (currentState: unknown, prevState: unknown) => {
    if (disposed) return

    try {
      play(detectChanges(currentState, prevState))
    } catch (error) {
      reportError(error, { stage: 'state-change-processing' }, onError)
      console.warn('Zusound: Error processing state change', error)
    }
  }

  const dispose = () => {
    if (disposed) return
    disposed = true

    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    pendingChanges.clear()
    releaseAudioEngine()
  }

  return Object.freeze({ enabled: true, update, play, dispose })
}
