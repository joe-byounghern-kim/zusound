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

import { createZusound } from './adapter'

export { createZusound }
export const zusound = createZusound()

// Public type exports. Change and sound types are defined by @zusound/core.
export type { AestheticParams, Change, SoundParams, ZusoundErrorContext } from '@zusound/core'
export type {
  ZusoundOptions,
  ZusoundApi,
  ZusoundInstance,
  ZusoundSubscriber,
  ZusoundUnsubscribe,
} from './types'

export { version } from './version'
