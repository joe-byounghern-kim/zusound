# 🔊 zusound

[![npm version](https://img.shields.io/npm/v/zusound)](https://www.npmjs.com/package/zusound)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zusound)](https://bundlephobia.com/package/zusound)
[![CI](https://github.com/joe-byounghern-kim/zusound/actions/workflows/ci.yml/badge.svg)](https://github.com/joe-byounghern-kim/zusound/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`zusound` is a browser-first Zustand middleware for optional Web Audio cues when top-level store state changes. It has no runtime dependencies beyond its Zustand peer, creates Web Audio lazily, and defaults audio off in production and unknown environments.

> **Upcoming v0.3.0:** an upcoming minor release with runtime entry points and defaults retained, plus improved typed composition, lifecycle guidance, and non-fatal diagnostics.

> **[Try the interactive Signal Lab →](https://joe-byounghern-kim.github.io/zusound/)**

Audio is optional feedback. Keep visual status and diagnostics available for every user.

<!-- README_SYNC:SECTION_START:install -->

## Install

```bash
npm install zusound zustand
```

Supported Zustand versions: `>=4.0.0 <6.0.0`. The examples use named imports supported by Zustand `>=4.5` and 5. An application pinned to Zustand 4.0 may need its legacy default `create` and `createStore` imports and the [4.0 ordering exception](#zustand-40-ordering-exception).

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

## API

### `zusound(initializer, options?)`

The middleware signature matches standard Zustand middleware usage.

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

## Zustand 4.0 ordering exception

Zustand 4.0 requires input-mutator metadata that prevents the modern wrapper order. For exactly 4.0, put Zusound outermost around selector, persist, or devtools middleware. Zustand `>=4.5` and 5 retain the modern recipes. See the [checked 4.0 consumer fixture](examples/consumer/smoke-v4.cts) for the precise legacy forms.

## Docs Map

- [Contributing](CONTRIBUTING.md)
- [Package API and recipes](packages/zusound/README.md)
- [Demo development](demo/README.md)
- [Release process](docs/RELEASING.md)
- [Agent skills](.agents/README.md)
- [Security policy](SECURITY.md)
- [Code of conduct](CODE_OF_CONDUCT.md)

For guided consumer integration, diagnosis, migration, and tuning, see the [Zusound Skills](.agents/README.md).

## Demo

[Open the hosted Signal Lab](https://joe-byounghern-kim.github.io/zusound/).

Run the same React and Vite application locally:

```bash
pnpm demo:dev
```

Open `http://localhost:5173`. For workspace details, see [demo/README.md](demo/README.md). Pages deployment is automated by `.github/workflows/deploy-demo.yml`.

## License

MIT © [joe-byounghern-kim](https://github.com/joe-byounghern-kim)
