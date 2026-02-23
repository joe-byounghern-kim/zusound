/**
 * 🔊 zusound
 *
 * Hear your state changes. Debug faster.
 *
 * @example
 * ```typescript
 * import { create } from 'zustand'
 * import { zusound } from 'zusound'
 *
 * const store = create(
 *   zusound(set => ({
 *     count: 0,
 *     increment: () => set(state => ({ count: state.count + 1 }))
 *   }))
 * )
 * ```
 */

export { zusound } from './middleware'
export { createZusound } from './adapter'

// Public type exports
export type {
  AestheticParams,
  ZusoundOptions,
  Change,
  SoundParams,
  ZusoundErrorContext,
  ZusoundApi,
  ZusoundInstance,
  ZusoundSubscriber,
  ZusoundUnsubscribe,
} from './types'

export { version } from './version'
