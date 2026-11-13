/**
 * Zusound — Zustand middleware type definitions.
 *
 * Store-facing option aliases, lifecycle handles, and the Zustand mutator
 * augmentation. Change and sound types come from `@zusound/core`.
 */

import type { SonifierOptions } from '@zusound/core'
import type { StateCreator, StoreMutatorIdentifier } from 'zustand/vanilla'

type Cast<T, U> = T extends U ? T : U
type Write<T, U> = Omit<T, keyof U> & U

declare module 'zustand/vanilla' {
  interface StoreMutators<S, A> {
    'zusound/cleanup': [A] extends [unknown] ? Write<Cast<S, object>, ZusoundApi> : never
  }
}

/**
 * Complete configuration options for Zusound. Same fields as `SonifierOptions`
 * from `@zusound/core`; kept as an interface so existing augmentations still merge.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ZusoundOptions extends SonifierOptions {}

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
 *
 * Create a fresh instance for each `store.subscribe(...)` attachment and call
 * both `unsubscribe()` and `instance.cleanup()` when the attachment is removed.
 */
export interface ZusoundInstance {
  /** Middleware mode: wraps a Zustand state creator. */
  <
    T extends object,
    Mis extends [StoreMutatorIdentifier, unknown][] = [],
    Mos extends [StoreMutatorIdentifier, unknown][] = [],
    U = T,
  >(
    initializer: StateCreator<T, Mis, Mos, U>,
    options?: ZusoundOptions
  ): StateCreator<T, Mis, [['zusound/cleanup', never], ...Mos], U>
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
