/**
 * Zusound core — Type definitions.
 *
 * Change descriptors, sound parameters, and sonifier options shared by the
 * diff and audio subsystems. Framework-agnostic: nothing here depends on a
 * state-management library.
 */

/**
 * Aesthetic parameters that control how a state change sounds.
 *
 * All numeric fields in the range [0, 1] are clamped internally.
 * These parameters are combined from three sources in priority order:
 *   1. `defaultAesthetics(change)` — baseline per value/operation type
 *   2. `options.aesthetics` — static user overrides
 *   3. `options.mapChangeToAesthetics(change)` — per-change dynamic overrides
 */
export interface AestheticParams {
  /** Consonance selection (0 = dissonant, 1 = consonant). Controls interval ranking. */
  pleasantness: number
  /** Harmonic rolloff brightness (0 = dark/muted, 1 = bright/sharp). */
  brightness: number
  /** Envelope speed (0 = slow attack/release, 1 = snappy/percussive). */
  arousal: number
  /** Envelope sustain character (0 = short sustain, 1 = full sustain). */
  valence: number
  /** Dyad onset spread (1 = both tones together, 0 = spread across ~80% of duration). */
  simultaneity: number
  /** Base MIDI pitch center before interval and path-identity offsets. */
  baseMidi?: number
  /** Duration in seconds (e.g. 0.15 = 150ms). Overrides the default duration derived from change type. */
  duration?: number
}

/** Configuration options for a sonifier. */
export interface SonifierOptions {
  /** Enable/disable audio feedback (default: true in dev, false in prod). */
  enabled?: boolean
  /** Global playback volume from 0 to 1 (default: 0.3). */
  volume?: number
  /** Debounce interval for state-change sound emission in milliseconds (default: 0). */
  debounceMs?: number
  /** Path-level overrides for frequency, waveform, timbre, duration, and volume. */
  soundMapping?: Record<string, Partial<SoundParams>>
  /** Base aesthetic tuning applied to all changes. */
  aesthetics?: Partial<AestheticParams>
  /** Per-change dynamic aesthetic override hook, called for each change selected for playback. */
  mapChangeToAesthetics?: (change: Change) => Partial<AestheticParams>
  /** Use static consonance ranking to reduce dissonance computation cost. */
  performanceMode?: boolean
  /** Optional hook for non-fatal state-processing and audio errors. Useful for telemetry. */
  onError?: (error: unknown, context: ZusoundErrorContext) => void
}

/** Context passed to the `onError` callback. */
export interface ZusoundErrorContext {
  /** Which processing stage the error occurred in. */
  stage: 'state-change-processing' | 'playback' | 'audio-resume'
  /** The change being processed when the error occurred, if available. */
  change?: Change
}

/** A single state change detected by the differ. */
export interface Change {
  /** Dot-free top-level key that changed (e.g. "count", "user"). */
  path: string
  /** Type of change operation. */
  operation: 'add' | 'remove' | 'update'
  /** Runtime type classification of the changed value. */
  valueType: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** The new value after the change. */
  newValue: unknown
  /** The previous value before the change. */
  oldValue: unknown
}

/** Low-level audio parameters for direct sound generation. */
export interface SoundParams {
  /** Frequency in Hz. */
  frequency: number
  /** Waveform type. Mapped to equivalent harmonic content internally. */
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle'
  /** Custom timbre settings. */
  timbre?: {
    /** Spectral brightness (0 = dark, 1 = bright). */
    brightness: number
    /** Number of harmonics to include in the periodic wave. */
    numHarmonics?: number
  }
  /** Duration in milliseconds. */
  duration: number
  /** Volume multiplier (0–1). */
  volume: number
}

/**
 * Turns state changes into short audio cues.
 *
 * Create one with `createSonifier()`. Sonifiers are frozen. A disabled
 * sonifier holds no audio resources and ignores every call.
 */
export interface Sonifier {
  /** Whether this sonifier plays cues. Resolved once, when the sonifier is created. */
  readonly enabled: boolean
  /** Diff two state snapshots and play a cue for each changed top-level key. */
  readonly update: (currentState: unknown, prevState: unknown) => void
  /** Play cues for changes you already have, such as the output of `detectChanges()`. */
  readonly play: (changes: readonly Change[]) => void
  /** Cancel pending cues and release audio resources. Safe to call more than once. */
  readonly dispose: () => void
}
