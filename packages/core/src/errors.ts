import type { SonifierOptions, ZusoundErrorContext } from './types'

/**
 * Deliver diagnostic errors without allowing telemetry failures to affect state
 * processing or playback. This boundary intentionally never reports its own
 * failures through `onError`, preventing recursive diagnostics.
 */
export function reportError(
  error: unknown,
  context: ZusoundErrorContext,
  onError?: SonifierOptions['onError']
): void {
  try {
    onError?.(error, context)
  } catch (reportingError) {
    try {
      console.debug('Zusound: Error reporting failed', reportingError)
    } catch {
      // Logging is best-effort and must not escape this boundary.
    }
  }
}
