/**
 * Core orchestration.
 *
 * Exposes `createZusound()` for stateful middleware/subscriber usage and
 * `attachZusound()` for low-level adapter wiring. Handles debounce timing,
 * shared state-change emission, and audio engine retain/release lifecycle.
 */

import type {
  Change,
  ZusoundAdapter,
  ZusoundHandle,
  ZusoundInstance,
  ZusoundOptions,
} from './types'
import { MAX_STAGGER_SECONDS, STAGGER_SECONDS } from './constants'
import { detectChanges } from './differ'
import { playSound, releaseAudioEngine, retainAudioEngine } from './audio'
import { resolveDefaultEnabled } from './env'
import type { StateCreator } from 'zustand/vanilla'

type EmitChangesOptions = Pick<
  ZusoundOptions,
  'volume' | 'soundMapping' | 'aesthetics' | 'mapChangeToAesthetics' | 'performanceMode' | 'onError'
>

/** Deduplicate pending changes by path, keeping only the latest per path. */
function deduplicateByPath(changes: Change[]): Change[] {
  const latestByPath = new Map<string, Change>()
  for (let i = changes.length - 1; i >= 0; i--) {
    const change = changes[i]
    if (latestByPath.has(change.path)) continue
    latestByPath.set(change.path, change)
  }
  return [...latestByPath.values()].reverse()
}

/** Play sounds for a batch of changes, staggering onset times. */
function emitChanges(changes: Change[], options: EmitChangesOptions): void {
  if (changes.length === 0) return

  const {
    volume = 0.3,
    soundMapping,
    aesthetics,
    mapChangeToAesthetics,
    performanceMode,
    onError,
  } = options

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
    }).catch((error) => {
      onError?.(error, { stage: 'playback', change })
      console.debug('Zusound: Audio playback failed', error)
    })
  }
}

/** Type guard: returns true if the value looks like a ZusoundOptions object (or is undefined). */
function isZusoundOptions(value: unknown): value is ZusoundOptions {
  if (value === undefined) return true
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false

  const optionKeys: ReadonlySet<string> = new Set([
    'enabled',
    'volume',
    'debounceMs',
    'soundMapping',
    'aesthetics',
    'mapChangeToAesthetics',
    'performanceMode',
    'onError',
  ])

  const keys = Object.keys(value as Record<string, unknown>)
  return keys.every((key) => optionKeys.has(key))
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
 * subscriber mode `(currentState, prevState)` based on argument types.
 */
function isMiddlewareCall<T extends object>(
  arg1: unknown,
  arg2: unknown,
  argCount: number
): arg1 is StateCreator<T, [], []> {
  if (typeof arg1 !== 'function') return false
  if (argCount === 1) return true
  if (arg2 === undefined) return true
  return isZusoundOptions(arg2)
}

/**
 * Wire audio feedback to a store adapter.
 *
 * Subscribes to state changes, runs the differ, and emits sounds.
 * Returns a handle whose `cleanup()` unsubscribes and releases audio resources.
 */
export function attachZusound<TState>(
  adapter: ZusoundAdapter<TState>,
  options: ZusoundOptions = {}
): ZusoundHandle {
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

  const cleanup = () => {}

  if (!enabled) {
    adapter.attachCleanup?.(cleanup)
    return { cleanup }
  }

  retainAudioEngine()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let pendingChanges: Change[] = []
  let cleanedUp = false

  let unsubscribe: ZusoundHandle['cleanup']
  try {
    unsubscribe = adapter.subscribe((currentState, prevState) => {
      if (cleanedUp) return

      try {
        const changes = detectChanges(currentState, prevState)

        if (debounceMs > 0) {
          pendingChanges.push(...changes)

          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            const flushed = deduplicateByPath(pendingChanges)
            pendingChanges = []
            debounceTimer = null
            emitChanges(flushed, {
              volume,
              soundMapping,
              aesthetics,
              mapChangeToAesthetics,
              performanceMode,
              onError,
            })
          }, debounceMs)
        } else {
          emitChanges(changes, {
            volume,
            soundMapping,
            aesthetics,
            mapChangeToAesthetics,
            performanceMode,
            onError,
          })
        }
      } catch (error) {
        onError?.(error, { stage: 'state-change-processing' })
        console.warn('Zusound: Error processing state change', error)
      }
    })
  } catch (error) {
    releaseAudioEngine()
    onError?.(error, { stage: 'state-change-processing' })
    console.warn('Zusound: Failed to attach subscription', error)
    adapter.attachCleanup?.(cleanup)
    return { cleanup }
  }

  const cleanupWithAudio = () => {
    if (cleanedUp) return
    cleanedUp = true

    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    pendingChanges = []
    try {
      unsubscribe()
    } finally {
      releaseAudioEngine()
    }
  }

  adapter.attachCleanup?.(cleanupWithAudio)

  return { cleanup: cleanupWithAudio }
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
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let pendingChanges: Change[] = []
  let cleanedUp = false
  let retainedSubscriberAudio = false

  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true

    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    pendingChanges = []

    if (retainedSubscriberAudio) {
      releaseAudioEngine()
      retainedSubscriberAudio = false
    }
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

    if (isMiddlewareCall<T>(arg1, arg2, args.length)) {
      const initializer = arg1
      const options = mergeOptions(baseOptions, arg2 as ZusoundOptions | undefined)

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

    const currentState = arg1 as T
    const prevState = arg2 as T
    const options = mergeOptions(baseOptions)

    if (cleanedUp || !options.enabled) return

    if (!retainedSubscriberAudio) {
      retainAudioEngine()
      retainedSubscriberAudio = true
    }

    try {
      const changes = detectChanges(currentState, prevState)

      if ((options.debounceMs ?? 0) > 0) {
        pendingChanges.push(...changes)

        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          const flushed = deduplicateByPath(pendingChanges)
          pendingChanges = []
          debounceTimer = null
          emitChanges(flushed, options)
        }, options.debounceMs)
      } else {
        emitChanges(changes, options)
      }
    } catch (error) {
      options.onError?.(error, { stage: 'state-change-processing' })
      console.warn('Zusound: Error processing state change', error)
    }

    return undefined
  }

  instance.cleanup = cleanup

  return instance
}
