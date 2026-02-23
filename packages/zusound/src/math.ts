/**
 * Shared math utilities used across synthesis, dissonance, and audio modules.
 */

/** Clamp a value to the [0, 1] interval. */
export function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/** Linear interpolation between two values. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Convert a MIDI note number to frequency in Hz (A4 = 69 = 440 Hz). */
export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}
