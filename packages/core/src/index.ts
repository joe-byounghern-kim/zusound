/**
 * 🔊 @zusound/core
 *
 * Framework-agnostic state diffing and Web Audio cues.
 *
 * @example
 * ```typescript
 * import { createSonifier } from '@zusound/core'
 *
 * const sonifier = createSonifier({ volume: 0.2 })
 * sonifier.update({ count: 1 }, { count: 0 })
 * sonifier.dispose()
 * ```
 */

export { createSonifier, sonifierOptionKeys } from './sonifier'
export { detectChanges } from './differ'
export { resolveDefaultEnabled } from './env'

// Public type exports
export type {
  AestheticParams,
  Change,
  Sonifier,
  SonifierOptions,
  SoundParams,
  ZusoundErrorContext,
} from './types'

export { version } from './version'
