/**
 * Zustand wiring.
 *
 * Exposes `createZusound()` for stateful middleware/subscriber usage and
 * `attachZusound()` for low-level adapter wiring. Diffing, debounce timing,
 * playback, and audio engine lifetime belong to the `@zusound/core` sonifier;
 * this module only decides when a sonifier exists and which store feeds it.
 */

import {
  createSonifier,
  resolveDefaultEnabled,
  sonifierOptionKeys,
  type Sonifier,
  type SonifierOptions,
  type ZusoundErrorContext,
} from '@zusound/core'
import type { ZusoundAdapter, ZusoundHandle, ZusoundInstance, ZusoundOptions } from './types'
import type { StateCreator } from 'zustand/vanilla'

const optionKeys: ReadonlySet<string> = new Set(sonifierOptionKeys)

/** Diagnose option typos using the shared environment detection, not explicit audio enablement. */
function warnUnknownOptions(options?: ZusoundOptions): void {
  if (!options || !resolveDefaultEnabled()) return

  const unknownKeys = Object.keys(options).filter((key) => !optionKeys.has(key))
  if (unknownKeys.length > 0) {
    console.warn(`Zusound: Unknown option keys: ${unknownKeys.join(', ')}`)
  }
}

/**
 * Keep only recognized keys. Typos were already reported when the options
 * reached `createZusound()` or the middleware call, so the sonifier must not
 * report them a second time.
 */
function toSonifierOptions(options: ZusoundOptions): SonifierOptions {
  const picked: Record<string, unknown> = {}
  for (const key of sonifierOptionKeys) {
    if (key in options) picked[key] = options[key]
  }
  return picked as SonifierOptions
}

/** Deliver a diagnostic without letting a throwing callback escape. */
function reportError(
  error: unknown,
  context: ZusoundErrorContext,
  onError?: ZusoundOptions['onError']
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

/** Merge base and per-call options, resolving `enabled` from the environment if unset. */
function mergeOptions(
  baseOptions: ZusoundOptions,
  overrideOptions?: ZusoundOptions
): ZusoundOptions {
  return {
    ...baseOptions,
    ...overrideOptions,
    enabled: overrideOptions?.enabled ?? baseOptions.enabled ?? resolveDefaultEnabled(),
  }
}

/**
 * Discriminate between middleware mode `(initializer, options?)` and
 * subscriber mode `(currentState, prevState)` based on the first argument.
 */
function isMiddlewareCall<T extends object>(arg1: unknown): arg1 is StateCreator<T, [], []> {
  return typeof arg1 === 'function'
}

/**
 * Wire audio feedback to a store adapter.
 *
 * Subscribes a sonifier to state changes. Returns a handle whose `cleanup()`
 * unsubscribes and releases audio resources.
 */
export function attachZusound<TState>(
  adapter: ZusoundAdapter<TState>,
  options: ZusoundOptions = {}
): ZusoundHandle {
  const noopCleanup = () => {}
  const sonifier = createSonifier(toSonifierOptions(options))

  if (!sonifier.enabled) {
    adapter.attachCleanup?.(noopCleanup)
    return { cleanup: noopCleanup }
  }

  let unsubscribe: ZusoundHandle['cleanup']
  try {
    unsubscribe = adapter.subscribe(sonifier.update)
  } catch (error) {
    sonifier.dispose()
    reportError(error, { stage: 'state-change-processing' }, options.onError)
    console.warn('Zusound: Failed to attach subscription', error)
    adapter.attachCleanup?.(noopCleanup)
    return { cleanup: noopCleanup }
  }

  let cleanedUp = false
  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true

    try {
      unsubscribe()
    } finally {
      sonifier.dispose()
    }
  }

  adapter.attachCleanup?.(cleanup)

  return { cleanup }
}

/**
 * Create a stateful zusound instance that works in both middleware and subscriber mode.
 *
 * **Middleware mode**: `create(instance(initializer, options))`
 * **Subscriber mode**: `store.subscribe(instance)`
 *
 * Call `instance.cleanup()` to release audio resources.
 */
export function createZusound(baseOptions: ZusoundOptions = {}): ZusoundInstance {
  warnUnknownOptions(baseOptions)

  let cleanedUp = false
  // Created on the first enabled subscriber call, so middleware-only use never holds audio.
  let subscriberSonifier: Sonifier | undefined

  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true

    subscriberSonifier?.dispose()
    subscriberSonifier = undefined
  }

  function instance<T extends object>(
    initializer: StateCreator<T, [], []>,
    options?: ZusoundOptions
  ): StateCreator<T, [], []>
  function instance<T extends object>(currentState: T, prevState: T): void
  function instance<T extends object>(
    ...args: [StateCreator<T, [], []>, ZusoundOptions?] | [T, T]
  ): StateCreator<T, [], []> | undefined {
    const arg1 = args[0]
    const arg2 = args[1]

    if (isMiddlewareCall<T>(arg1)) {
      const initializer = arg1
      const overrideOptions = arg2 as ZusoundOptions | undefined
      warnUnknownOptions(overrideOptions)
      const options = mergeOptions(baseOptions, overrideOptions)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (...storeArgs: any[]) => {
        const [, get, api] = storeArgs
        const handle = attachZusound(
          {
            getState: get,
            subscribe: api.subscribe,
            attachCleanup: (attachedCleanup) => {
              Reflect.set(api, 'zusoundCleanup', attachedCleanup)
            },
          },
          options
        )

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (initializer as any)(...storeArgs)
        } catch (error) {
          handle.cleanup()
          throw error
        }
      }
    }

    // Enablement is re-resolved per call, matching the environment at each update.
    if (cleanedUp || !mergeOptions(baseOptions).enabled) return

    subscriberSonifier ??= createSonifier(toSonifierOptions({ ...baseOptions, enabled: true }))
    subscriberSonifier.update(arg1, arg2)

    return undefined
  }

  instance.cleanup = cleanup

  return instance as ZusoundInstance
}
