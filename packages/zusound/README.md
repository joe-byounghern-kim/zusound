# 🔊 zusound

`zusound` is a browser-first [Zustand](https://zustand.docs.pmnd.rs/) middleware for optional Web Audio cues when top-level store state changes. It is a debugging and feedback aid, not a replacement for visual status, logs, or accessible notifications.

> **Upcoming v0.3.0:** keeps runtime entry points and defaults while improving typed middleware composition, cleanup guidance, and diagnostic isolation. See [Upgrade from v0.2.x](#upgrade-from-v02x) for the TypeScript migration detail. The minor release Changeset is maintained separately.

<!-- README_SYNC:SECTION_START:install -->

## Install

```bash
npm install zusound zustand
```

Supported Zustand versions: `>=4.0.0 <6.0.0`. The examples use named imports supported by modern Zustand 4 and 5. An application pinned to Zustand 4.0 may need its legacy default `create` and `createStore` imports instead.

<!-- README_SYNC:SECTION_END:install -->

<!-- README_SYNC:SECTION_START:quick-start -->

## Quick start

Use the middleware for a store that should own its audio lifecycle. Explicitly enable it while developing so the behavior does not depend on environment detection.

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { zusound } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const counterState: StateCreator<CounterState, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

const enhancedCounterState = zusound(counterState, { enabled: true, volume: 0.2 })

export const useCounterStore = create<CounterState>()(enhancedCounterState)

// Call from a click or tap handler while testing in a browser.
export function incrementFromUserGesture(): void {
  useCounterStore.getState().increment()
}

// Call when the store is permanently disposed, such as an integration test teardown.
export function disposeCounterAudio(): void {
  useCounterStore.zusoundCleanup()
}
```

Browsers can suspend an `AudioContext` until a user gesture. Click or tap a control that triggers one known update, such as `incrementFromUserGesture()`, before deciding that audio is unavailable.

<!-- README_SYNC:SECTION_END:quick-start -->

## Choose an integration mode

- **Middleware** attaches cleanup to one Zustand store. Call that store's `zusoundCleanup()` when the store is disposed.
- **Subscriber** is useful when the store must stay independent of audio. The attachment owns both its subscription and its `createZusound()` instance.

<!-- README_SYNC:SECTION_START:create-zusound -->

### `createZusound(options?)`

Create a fresh configured instance for each subscriber attachment. On teardown, call **both** `unsubscribe()` and `zs.cleanup()`. A cleaned-up instance is terminal. Create another instance rather than reusing it.

```typescript
import { createStore } from 'zustand/vanilla'
import { createZusound } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const store = createStore<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

const zs = createZusound({ enabled: true, volume: 0.2, debounceMs: 80 })
const unsubscribe = store.subscribe(zs)

export function incrementFromUserGesture(): void {
  store.getState().increment()
}

export function disposeSubscriberAudio(): void {
  unsubscribe()
  zs.cleanup()
}
```

`zs.cleanup()` releases resources held by that subscriber instance. It does **not** detach stores created by the middleware. Use `store.zusoundCleanup()` for a middleware store.

<!-- README_SYNC:SECTION_END:create-zusound -->

## Middleware composition

The following compositions are supported and preserve the store cleanup method. Keep the demonstrated order when applying them. Other middleware combinations should be typechecked and tested in your application before adoption.

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { zusound } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const counterState: StateCreator<CounterState, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

const enhancedCounterState = devtools(
  persist(zusound(counterState, { enabled: true }), { name: 'counter' })
)

export const useCounterStore = create<CounterState>()(enhancedCounterState)

useCounterStore.zusoundCleanup()
```

```typescript
import { createStore } from 'zustand/vanilla'
import type { StateCreator } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'
import { zusound } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const counterState: StateCreator<CounterState, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

const enhancedCounterState = subscribeWithSelector(zusound(counterState, { enabled: true }))

const store = createStore<CounterState>()(enhancedCounterState)

const unsubscribe = store.subscribe(
  (state) => state.count,
  (count) => console.info('count changed', count)
)

unsubscribe()
store.zusoundCleanup()
```

## Runtime and lifecycle notes

### Environment, SSR, and browser activation

- The default is on for recognized development or test environments and off for production. If the environment cannot be classified, it is off.
- Set `enabled: true` for deliberate production feedback. Set `enabled: false` for an SSR-created store, then attach or enable browser-only behavior in a client lifecycle boundary.
- Importing the package is SSR-safe. Web Audio is created lazily only when enabled playback is attempted in a browser. Mapping hooks are not invoked during SSR because no browser playback reaches that stage.
- A browser may still require a direct click or tap before `AudioContext.resume()` succeeds. Do not infer audible playback from an automated test or a mocked audio context.
- Cleanup is idempotent and cancels pending debounced work. Subscriber ownership remains separate from middleware-store ownership.

### What counts as a change

ZuSound emits descriptors for changed **top-level** state keys, such as `count` or `session`. A nested mutation that keeps the same top-level reference can be missed, so use Zustand's normal immutable updates. Equality begins with references and shallow comparison, then falls back to JSON serialization for supported structures. Functions, cyclic values, and other non-serializable values have practical comparison limits.

With `debounceMs > 0`, emissions occur on the trailing edge. The retained descriptor is the latest change for each affected top-level path, ordered by each path's final occurrence. This bounds retention by distinct paths. It is not a net-diff calculation and it does not impose a maximum playback rate across separate debounce windows.

<!-- README_SYNC:SECTION_START:zusound-options -->

## `ZusoundOptions`

| Option                  | Type                                   | Default                                        | Description                                                                                    |
| ----------------------- | -------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `enabled`               | `boolean`                              | recognized dev/test: `true`, otherwise `false` | Enables optional audio feedback. Set explicitly when behavior matters.                         |
| `volume`                | `number`                               | `0.3`                                          | Global gain multiplier. Keep it in `0..1`; validate this application option before passing it. |
| `debounceMs`            | `number`                               | `0`                                            | Trailing-edge debounce interval in **milliseconds**.                                           |
| `soundMapping`          | `Record<string, Partial<SoundParams>>` | `undefined`                                    | Final path-specific sound overrides. A mapping `volume` is clamped to `0..1`.                  |
| `aesthetics`            | `Partial<AestheticParams>`             | value and operation defaults                   | Static aesthetic overrides. Bounded aesthetic controls are clamped to `0..1`.                  |
| `mapChangeToAesthetics` | `(change) => Partial<AestheticParams>` | `undefined`                                    | Dynamic aesthetic override for an emitted descriptor that reaches browser playback.            |
| `performanceMode`       | `boolean`                              | `false`                                        | Uses static consonance ranking to reduce ranking work.                                         |
| `onError`               | `(error, context) => void`             | `undefined`                                    | Receives non-fatal state-processing, playback, or resume diagnostics.                          |

<!-- README_SYNC:SECTION_END:zusound-options -->

<!-- README_SYNC:SECTION_START:aesthetic-parameters -->

## `AestheticParams`

| Parameter      | Range or unit | Effect                                                                              |
| -------------- | ------------- | ----------------------------------------------------------------------------------- |
| `pleasantness` | `0..1`        | Consonance selection.                                                               |
| `brightness`   | `0..1`        | Harmonic brightness.                                                                |
| `arousal`      | `0..1`        | Envelope speed.                                                                     |
| `valence`      | `0..1`        | Envelope sustain character.                                                         |
| `simultaneity` | `0..1`        | Dyad onset spread. `1` starts together; `0` spreads over about 80% of the duration. |
| `baseMidi`     | MIDI note     | Base pitch center before interval mapping.                                          |
| `duration`     | **seconds**   | Aesthetic duration override, for example `0.15` for 150 ms.                         |

`SoundParams.duration` inside `soundMapping` uses **milliseconds**, while `AestheticParams.duration` uses **seconds**.

<!-- README_SYNC:SECTION_END:aesthetic-parameters -->

## Mapping precedence and units

For a change, ZuSound resolves sound character in this order:

1. Value and operation defaults.
2. `aesthetics` static overrides.
3. `mapChangeToAesthetics(change)` dynamic overrides.
4. `soundMapping[change.path]` final path mapping.

A path mapping can directly override `frequency`, `duration`, and per-sound `volume`. Its `timbre` takes precedence over its `waveform`; either can set the final brightness and harmonic profile. The dynamic aesthetic hook overrides the static aesthetic option, but path mapping is applied last.

<!-- README_SYNC:SECTION_START:advanced-example -->

## Advanced example

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { zusound } from 'zusound'

type PlayerState = {
  status: 'idle' | 'playing' | 'error'
  progress: number
  setStatus: (status: PlayerState['status']) => void
  advance: () => void
}

const playerState: StateCreator<PlayerState, [], []> = (set) => ({
  status: 'idle',
  progress: 0,
  setStatus: (status) => set({ status }),
  advance: () => set((state) => ({ progress: state.progress + 1 })),
})

const enhancedPlayerState = zusound(playerState, {
  enabled: true,
  volume: 0.18,
  debounceMs: 40,
  aesthetics: { pleasantness: 0.75, brightness: 0.55, duration: 0.16 },
  mapChangeToAesthetics: (change) =>
    change.path === 'status' && change.newValue === 'error'
      ? { pleasantness: 0.2, brightness: 0.9 }
      : {},
  soundMapping: {
    progress: { waveform: 'sine', duration: 80, volume: 0.5 },
    status: { frequency: 330, waveform: 'triangle', duration: 180, volume: 0.7 },
  },
  onError: (error, context) => console.warn('Zusound diagnostic', context.stage, error),
})

export const usePlayerStore = create<PlayerState>()(enhancedPlayerState)
```

In this example, `aesthetics.duration: 0.16` is seconds. `soundMapping.progress.duration: 80` and `soundMapping.status.duration: 180` are milliseconds and win for their respective paths.

<!-- README_SYNC:SECTION_END:advanced-example -->

<!-- README_SYNC:SECTION_START:production-notes -->

## Production and accessibility

- Audio is optional. Preserve visual status, validation messages, and other non-audio diagnostics.
- Let people control whether feedback is enabled and select an appropriate low volume.
- Production and unknown environments default to off. Production feedback requires `{ enabled: true }`.
- Use `onError` for telemetry only. A reported audio failure does not mean that a state update failed.

<!-- README_SYNC:SECTION_END:production-notes -->

<!-- README_SYNC:SECTION_START:what-youll-hear -->

## Cue model

- Numbers receive pitch and duration modulation based on the update magnitude.
- Booleans are short cues.
- Strings are brighter by default.
- Objects and arrays are more layered by default.
- A top-level path has a stable relative pitch offset, so repeated changes can be recognizable.

The exact rendered result depends on browser audio support, user activation, output device, and your configuration.

<!-- README_SYNC:SECTION_END:what-youll-hear -->

## Upgrade from v0.2.x

The v0.3.0 release is an upcoming minor upgrade. Runtime middleware and subscriber entry points, peer range, and audio defaults remain compatible. Call `store.zusoundCleanup()` for middleware stores, and use a new `createZusound()` instance plus `unsubscribe()` and `cleanup()` for each subscriber attachment.

For TypeScript, retain an explicitly annotated initializer if you need one, but infer the wrapped output before creating the store: `const enhanced = zusound(initializer)` followed by `create<State>()(enhanced)` or `createStore<State>()(enhanced)`. Directly passing an explicitly typed initializer to `create<State>()(zusound(initializer))` does not retain the typed cleanup output. This is a TypeScript integration migration, not a runtime API change.

## Related documentation

- [Project overview](https://github.com/joe-byounghern-kim/zusound/blob/main/README.md)
- [Consumer Skills](../../.agents/README.md)
- [Interactive demo](https://joe-byounghern-kim.github.io/zusound/)
- [Contributing](../../CONTRIBUTING.md)

## License

MIT © [joe-byounghern-kim](https://github.com/joe-byounghern-kim)
