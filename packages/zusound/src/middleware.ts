import type { StateCreator } from 'zustand/vanilla'
import { createZusound } from './adapter'
import type { ZusoundOptions } from './types'

let hasWarnedSubscriberMisuse = false

function warnSubscriberMisuse(): void {
  if (hasWarnedSubscriberMisuse) return
  hasWarnedSubscriberMisuse = true
  console.warn(
    'Zusound: `zusound` only wraps Zustand initializers. For subscriber usage, create a dedicated instance with `createZusound(options)`.'
  )
}

export function zusound<T extends object>(
  initializer: StateCreator<T, [], []>,
  options?: ZusoundOptions
): StateCreator<T, [], []>
export function zusound(
  initializer: unknown,
  options?: ZusoundOptions
): StateCreator<object, [], []> | undefined {
  if (typeof initializer !== 'function') {
    warnSubscriberMisuse()
    return undefined
  }

  return createZusound()(initializer as StateCreator<object, [], []>, options) as StateCreator<
    object,
    [],
    []
  >
}

export default zusound
