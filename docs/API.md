# Zusound API reference

Current browser audio integration for Zustand `>=4.0.0 <6.0.0`.
For a first store, start with the [quick start](../README.md#quick-start).
Examples below use Zustand `>=4.5` and 5 unless noted otherwise.

- [Entry points and ownership](#entry-points-and-ownership)
- [Subscriber integration](#subscriber-integration)
- [Middleware composition](#middleware-composition)
- [Options](#zusoundoptions)
- [Public types](#public-types)
- [Mapping precedence and units](#mapping-precedence-and-units)
- [Runtime, changes, and debounce](#runtime-changes-and-debounce)
- [Diagnostics](#diagnostics)

## Entry points and ownership

### `zusound(initializer, options?)`

The exported `zusound` is a default `ZusoundInstance`, created with
`createZusound()`. In middleware mode it wraps a Zustand `StateCreator` and adds
`zusoundCleanup(): void` to the resulting store API, not to its state.
It works with React's `create` and vanilla `createStore`.

Preserve a typed initializer, infer the enhanced intermediate, then pass it to
`create<State>()(enhanced)` or `createStore<State>()(enhanced)`. Annotating the
wrapped output as a plain `StateCreator<State, [], []>` erases cleanup metadata.
Directly nesting an explicitly typed initializer in
`create<State>()(zusound(initializer))` also does not retain typed cleanup.
Do not repair this with a cast. The quick start and composition examples use the
inferred intermediate deliberately.

Call `store.zusoundCleanup()` when the store's audio integration is permanently
disposed. It unsubscribes the middleware's audio listener, cancels pending work,
and releases its audio resources. The underlying Zustand store remains usable.
Cleanup is idempotent, including when audio was disabled.

### `createZusound(options?)`

Returns a configured, dual-mode `ZusoundInstance`:

- **Middleware:** `instance(initializer, options?)` uses the instance's base
  options with per-call overrides. Options are shallow-merged, not deep-merged.
  Each resulting store owns its own `zusoundCleanup()`.
- **Subscriber:** `store.subscribe(instance)` calls the instance with current and
  previous state. Create a fresh instance for each attachment.

For a subscriber, call **both** the subscription's `unsubscribe()` and the
instance's `cleanup()`. Unsubscribing alone does not release its audio resources
or cancel pending debounce. Instance cleanup alone does not detach the Zustand
subscription. A cleaned-up subscriber is terminal. Create a new instance to
reattach. Do not share one subscriber across stores or use the exported singleton
`zusound` as a reusable subscriber.

`instance.cleanup()` controls that instance's subscriber resources. It does
**not** detach middleware stores created with it. Those stores must each call
`store.zusoundCleanup()`.

### `version`

The exported `version: string` identifies the installed package version.

## Subscriber integration

Use this mode when an existing store should stay independent of audio, or an
attachment has a shorter lifetime than its store.

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

// Call from a browser click or tap handler.
export function incrementFromUserGesture(): void {
  store.getState().increment()
}

export function disposeSubscriberAudio(): void {
  unsubscribe()
  zs.cleanup()
}
```

### React effect and StrictMode

Create the instance **inside each effect setup**. Development StrictMode may run
setup, cleanup, then setup again. Each setup needs a fresh instance, not the
terminal instance from the previous setup.

```tsx
import { useEffect } from 'react'
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

export function CounterSoundAttachment(): null {
  useEffect(() => {
    const zs = createZusound({ enabled: true, volume: 0.15 })
    const unsubscribe = store.subscribe(zs)
    return () => {
      unsubscribe()
      zs.cleanup()
    }
  }, [])
  return null
}

export function incrementFromUserGesture(): void {
  store.getState().increment()
}
```

Render the attachment at its intended ownership boundary and wire the action to
a click or tap. An effect's mount-time update is not a browser-activation check.
For an existing persisted or devtools store, the effect can subscribe without
changing its initializer or middleware order.

## Middleware composition

The following recipes retain typed store cleanup on Zustand `>=4.5` and 5.
Preserve demonstrated ordering. Typecheck and test other middleware combinations
in your application rather than assuming arbitrary stacks are supported.

### `devtools` and `persist`

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
  persist(zusound(counterState, { enabled: true, volume: 0.2 }), { name: 'counter' })
)

export const useCounterStore = create<CounterState>()(enhancedCounterState)

export function disposeCounterAudio(): void {
  useCounterStore.zusoundCleanup()
}
```

### `subscribeWithSelector`

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

const enhancedCounterState = subscribeWithSelector(
  zusound(counterState, { enabled: true, volume: 0.2 })
)
const store = createStore<CounterState>()(enhancedCounterState)
const unsubscribe = store.subscribe(
  (state) => state.count,
  (count) => console.info('count changed', count)
)

export function disposeCounterAudio(): void {
  unsubscribe()
  store.zusoundCleanup()
}
```

The selector listener above is separate from Zusound's top-level audio listener.
Its unsubscribe function does not replace store audio cleanup.

### Zustand 4.0 ordering exception

Exactly Zustand 4.0 requires input-mutator metadata that prevents the modern
wrapper order. Put Zusound **outermost** for `subscribeWithSelector`, `persist`,
or `devtools`: `zusound(subscribeWithSelector(initializer))`,
`zusound(persist(initializer, options))`, or `zusound(devtools(initializer))`.
That version can also require legacy default `create` and `createStore` imports.
The [checked 4.0 consumer fixture](../examples/consumer/smoke-v4.cts) provides the
precise legacy forms. Do not apply this exception to newer versions merely to
match the legacy recipe.

## `ZusoundOptions`

All fields are optional. Supply options to `zusound(initializer, options)` or
`createZusound(options)`. Middleware per-call options override instance defaults.

| Option                  | Type                                                     | Default                                        | Meaning                                                                                                       |
| ----------------------- | -------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `enabled`               | `boolean`                                                | recognized dev/test: `true`, otherwise `false` | Enable optional audio. Set explicitly when behavior matters.                                                  |
| `volume`                | `number`                                                 | `0.3`                                          | Global gain multiplier. Validate a finite value in `0..1` in the application. It is not clamped for you.      |
| `debounceMs`            | `number`                                                 | `0`                                            | Trailing-edge debounce in **milliseconds**. `0` emits without debounce.                                       |
| `soundMapping`          | `Record<string, Partial<SoundParams>>`                   | `undefined`                                    | Final overrides keyed by top-level path.                                                                      |
| `aesthetics`            | `Partial<AestheticParams>`                               | value and operation defaults                   | Static character overrides. Bounded controls are clamped to `0..1`.                                           |
| `mapChangeToAesthetics` | `(change: Change) => Partial<AestheticParams>`           | `undefined`                                    | Dynamic overrides for an emitted descriptor reaching browser playback. Not a listener for every state update. |
| `performanceMode`       | `boolean`                                                | `false`                                        | Use static consonance ranking to reduce ranking work.                                                         |
| `onError`               | `(error: unknown, context: ZusoundErrorContext) => void` | `undefined`                                    | Observe non-fatal processing, playback, and resume errors.                                                    |

## Public types

Import types from `zusound`. The public declarations are in
[`types.ts`](../packages/zusound/src/types.ts).

### `AestheticParams`

The five bounded controls are required in the full type. Options accept
`Partial<AestheticParams>`, so provide only the overrides you need.

| Field          | Type / range or unit  | Meaning                                                                    |
| -------------- | --------------------- | -------------------------------------------------------------------------- |
| `pleasantness` | `number`, `0..1`      | Consonance selection.                                                      |
| `brightness`   | `number`, `0..1`      | Harmonic brightness.                                                       |
| `arousal`      | `number`, `0..1`      | Envelope speed.                                                            |
| `valence`      | `number`, `0..1`      | Envelope sustain character.                                                |
| `simultaneity` | `number`, `0..1`      | `1` starts tones together. `0` spreads onset across about 80% of duration. |
| `baseMidi?`    | `number`, MIDI note   | Base pitch center before interval mapping.                                 |
| `duration?`    | `number`, **seconds** | Aesthetic duration override, such as `0.15` for 150 ms.                    |

### `SoundParams`

`soundMapping[path]` accepts `Partial<SoundParams>`.

| Field       | Type / unit                                      | Meaning                                                                |
| ----------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `frequency` | `number`, Hz                                     | Direct base-frequency override.                                        |
| `waveform`  | `'sine' \| 'square' \| 'sawtooth' \| 'triangle'` | Equivalent harmonic profile.                                           |
| `timbre?`   | `{ brightness: number; numHarmonics?: number }`  | Custom profile. Brightness is clamped to `0..1`. Wins over `waveform`. |
| `duration`  | `number`, **milliseconds**                       | Path-specific duration override.                                       |
| `volume`    | `number`                                         | Per-sound multiplier. Finite mapping values are clamped to `0..1`.     |

### `Change`

| Field       | Type                                                       | Meaning                                                   |
| ----------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| `path`      | `string`                                                   | Changed top-level state key, not a nested traversal path. |
| `operation` | `'add' \| 'remove' \| 'update'`                            | Detected key operation.                                   |
| `valueType` | `'string' \| 'number' \| 'boolean' \| 'object' \| 'array'` | Runtime value classification.                             |
| `newValue`  | `unknown`                                                  | Value after the change.                                   |
| `oldValue`  | `unknown`                                                  | Value before the change.                                  |

### Lifecycle and diagnostics types

| Export                      | Shape / behavior                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ZusoundApi`                | `{ zusoundCleanup: () => void }`, added to a middleware store.                                                                                                                                                            |
| `ZusoundInstance`           | Callable middleware wrapper and `(currentState, prevState) => void` subscriber, with `cleanup(): void`. The middleware overload preserves existing mutators and prepends `['zusound/cleanup', never]` to output mutators. |
| `ZusoundSubscriber<TState>` | `(currentState: TState, prevState: TState) => void`.                                                                                                                                                                      |
| `ZusoundUnsubscribe`        | `() => void`.                                                                                                                                                                                                             |
| `ZusoundErrorContext`       | `{ stage: 'state-change-processing' \| 'playback' \| 'audio-resume'; change?: Change }`.                                                                                                                                  |

The internal adapter and audio helpers are not package-root exports.

## Mapping precedence and units

Sound character is resolved in this order:

1. Value and operation defaults.
2. Static `aesthetics`.
3. Dynamic `mapChangeToAesthetics(change)`.
4. Final `soundMapping[change.path]` overrides.

Path mappings can directly override frequency, duration, and per-sound volume.
Mapping `timbre` takes precedence over `waveform`. The mapping volume multiplies
global volume, rather than replacing it.

**Units differ:** `AestheticParams.duration` is **seconds**.
`SoundParams.duration` and `debounceMs` are **milliseconds**.

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

export function disposePlayerAudio(): void {
  usePlayerStore.zusoundCleanup()
}
```

Here `aesthetics.duration: 0.16` is 160 ms. The path durations of 80 ms and 180 ms
win for `progress` and `status`, respectively.

## Runtime, changes, and debounce

### Environment, SSR, and browser activation

- Recognized development/test environments default on. Production and unknown
  environments default off. Use explicit enablement for deliberate feedback.
- Import is SSR-safe. Web Audio is created lazily only when enabled playback is
  attempted in a browser. Dynamic mapping hooks do not run during SSR because
  playback does not reach that stage.
- Use `{ enabled: false }` for an SSR-created store. To add browser audio later,
  attach a fresh subscriber at a client lifecycle boundary. There is no public
  enable/disable setter for an existing middleware attachment.
- Browsers can require a direct click or tap before `AudioContext.resume()`
  succeeds. A passing test or mock does not prove audible playback.
- Enabled attachments share the audio engine. Cleanup releases one attachment's
  ownership. Final release closes the context and clears shared scheduling.

### Detected changes

Descriptors identify changed **top-level keys**, such as `count` or `session`,
not individual nested fields. Keep normal immutable Zustand updates. Mutating a
nested object while retaining its top-level reference can be missed.

Equality checks references and shallow contents first, handles dates, maps, and
sets, and falls back to JSON serialization for supported structures. Functions,
cyclic values, and other non-serializable values have practical comparison limits.
Do not treat audio descriptors as an exhaustive change log.

### Debounce

With `debounceMs > 0`, playback emission is trailing-edge. The buffer retains the
latest descriptor for each affected top-level path, ordered by that path's final
occurrence, with retention bounded by distinct paths. It is **not** a net diff:
a value that changes and then returns to its original value can still emit its
last descriptor. It is not a maximum playback-rate limit across separate windows.
Cleanup cancels pending debounce work.

### Default cues

Numbers receive magnitude-based pitch and duration modulation. Booleans use short
cues, strings are brighter, and objects and arrays are more layered. Each
top-level path has a stable relative pitch offset. Actual output depends on
browser support, activation, device, and configuration. Keep visual status,
validation messages, and other accessible non-audio feedback available.

## Diagnostics

`onError(error, context)` reports non-fatal audio integration failures:

- `state-change-processing`: subscription attachment or change processing failed.
- `playback`: synchronous playback preparation failed, including a throwing mapping hook.
- `audio-resume`: resuming a suspended audio context rejected.

`context.change` is provided when a descriptor is available. Use the callback for
best-effort diagnostics or telemetry, not to decide whether a Zustand update
succeeded. Callback exceptions are isolated and are not recursively reported.
Absence of a callback is not proof of audio availability. Unsupported Web Audio,
context-construction failures, and errors inside scheduled audio-node creation
can return without an `onError` notification. Scheduled task errors are logged
with `console.debug` instead.

For a missing cue, confirm explicit enablement, a real post-gesture top-level
update, active wiring, and teardown state before tuning. See the
[debugging skill](../.agents/skills/zusound-debugging/SKILL.md) for a focused workflow.
