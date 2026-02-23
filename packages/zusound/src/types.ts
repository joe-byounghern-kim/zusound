/**
 * Zusound — Type definitions.
 *
 * Public option interfaces, change descriptors, and lifecycle handles
 * used across the middleware, adapter, and audio subsystems.
 */

import type { StateCreator } from 'zustand/vanilla'

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

/** Complete configuration options for Zusound. */
export interface ZusoundOptions {
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
  /** Per-change dynamic aesthetic override hook. Called for every detected change. */
  mapChangeToAesthetics?: (change: Change) => Partial<AestheticParams>
  /** Use static consonance ranking to reduce dissonance computation cost. */
  performanceMode?: boolean
  /** Optional hook for non-fatal middleware/audio errors. Useful for telemetry. */
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

/** Extended Zustand store API surface when zusound middleware is attached. */
export interface ZusoundApi {
  /** Remove the zusound subscription and release audio resources. */
  zusoundCleanup: () => void
}

/** Function that removes a store subscription. */
export type ZusoundUnsubscribe = () => void

/**
 * Minimal store adapter interface used by `attachZusound`.
 * Decouples the audio wiring from Zustand's concrete store shape.
 */
export interface ZusoundAdapter<TState> {
  getState: () => TState
  subscribe: (listener: (state: TState, prevState: TState) => void) => ZusoundUnsubscribe
  /** Optional callback to attach a cleanup function to the store API. */
  attachCleanup?: (cleanup: () => void) => void
}

/** Subscriber function signature matching Zustand's `store.subscribe` callback. */
export type ZusoundSubscriber<TState> = (currentState: TState, prevState: TState) => void

/**
 * A dual-mode zusound instance.
 *
 * Can be used as:
 * - **Middleware**: `create(instance(initializer, options))`
 * - **Subscriber**: `store.subscribe(instance)`
 */
export interface ZusoundInstance {
  /** Middleware mode: wraps a Zustand state creator. */
  <T>(initializer: StateCreator<T, [], []>, options?: ZusoundOptions): StateCreator<T, [], []>
  /** Subscriber mode: called with (currentState, prevState) on each store update. */
  <T>(currentState: T, prevState: T): void
  /** Release audio resources held by this instance. */
  cleanup: () => void
}

/** Minimal cleanup handle returned by `attachZusound`. */
export interface ZusoundHandle {
  /** Remove the subscription and release audio resources. */
  cleanup: () => void
}
