# 🔊 zusound

Hear your state changes. Debug faster.

`zusound` is a Zustand middleware that converts state changes into short Web Audio cues so you can hear update patterns while debugging.

<!-- README_SYNC:SECTION_START:install -->

## Install

```bash
npm install zusound
```

Supported Zustand versions: `>=4 <6`.

<!-- README_SYNC:SECTION_END:install -->

<!-- README_SYNC:SECTION_START:quick-start -->

## Quick Usage

```typescript
import { create } from 'zustand'
import { zusound } from 'zusound'

const useStore = create(
  zusound((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))
)
```

<!-- README_SYNC:SECTION_END:quick-start -->

## API

### `zusound(initializer, options?)`

The middleware signature matches standard Zustand middleware usage.

<!-- README_SYNC:SECTION_START:create-zusound -->

### `createZusound(options?)`

Create a configured, stateful instance that works in both middleware and subscriber mode:

```typescript
import { create } from 'zustand'
import { createZusound } from 'zusound'

const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))

const zs = createZusound({ enabled: true, volume: 0.5, debounceMs: 80 })
const unsubscribe = useStore.subscribe(zs)

// later
unsubscribe()
zs.cleanup()
```

<!-- README_SYNC:SECTION_END:create-zusound -->

<!-- README_SYNC:SECTION_START:zusound-options -->

### `ZusoundOptions`

| Option                  | Type                                   | Default                                    | Description                                                          |
| ----------------------- | -------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `enabled`               | `boolean`                              | `true` in dev-like envs, `false` otherwise | Enables/disables audio feedback                                      |
| `volume`                | `number`                               | `0.3`                                      | Global playback volume (`0..1`)                                      |
| `debounceMs`            | `number`                               | `0`                                        | Debounce state-change sound emission                                 |
| `soundMapping`          | `Record<string, Partial<SoundParams>>` | `undefined`                                | Path-level overrides for timbre/frequency/waveform                   |
| `aesthetics`            | `Partial<AestheticParams>`             | type-specific defaults                     | Base tuning for pleasantness/brightness/arousal/valence/simultaneity |
| `mapChangeToAesthetics` | `(change) => Partial<AestheticParams>` | `undefined`                                | Per-change dynamic aesthetic override hook                           |
| `performanceMode`       | `boolean`                              | `false`                                    | Uses static consonance ranking to reduce dissonance computation cost |
| `onError`               | `(error, context) => void`             | `undefined`                                | Optional hook for non-fatal middleware/audio errors                  |

<!-- README_SYNC:SECTION_END:zusound-options -->

<!-- README_SYNC:SECTION_START:aesthetic-parameters -->

### Aesthetic Parameters

| Param          | Range    | Effect                                                              |
| -------------- | -------- | ------------------------------------------------------------------- |
| `pleasantness` | `0..1`   | Consonance selection, supports fractional semitone interpolation    |
| `brightness`   | `0..1`   | Harmonic rolloff control for timbre brightness                      |
| `arousal`      | `0..1`   | Envelope speed (attack/decay/release)                               |
| `valence`      | `0..1`   | Envelope sustain character                                          |
| `simultaneity` | `0..1`   | Dyad onset spread (`1` = together, `0` = spread over ~80% duration) |
| `baseMidi`     | `number` | Base pitch center before interval mapping                           |
| `duration`     | `number` | Optional note duration override (seconds)                           |

<!-- README_SYNC:SECTION_END:aesthetic-parameters -->

<!-- README_SYNC:SECTION_START:advanced-example -->

## Advanced Example

```typescript
import { create } from 'zustand'
import { zusound } from 'zusound'

const useStore = create(
  zusound(
    (set) => ({
      count: 0,
      status: 'idle',
      inc: () => set((state) => ({ count: state.count + 1 })),
      setStatus: (status: string) => set({ status }),
    }),
    {
      enabled: true,
      volume: 0.28,
      debounceMs: 40,
      performanceMode: false,
      aesthetics: {
        pleasantness: 0.75,
        brightness: 0.65,
        arousal: 0.55,
        valence: 0.6,
        simultaneity: 1,
        baseMidi: 69,
      },
      mapChangeToAesthetics: (change) => {
        if (change.operation === 'add') return { pleasantness: 0.9, valence: 0.8 }
        if (change.operation === 'remove') return { pleasantness: 0.35, arousal: 0.7 }
        return {}
      },
    }
  )
)
```

<!-- README_SYNC:SECTION_END:advanced-example -->

<!-- README_SYNC:SECTION_START:production-notes -->

## Production Notes

- Defaults are production-safe: audio is off in production unless `enabled: true` is explicitly set.
- If the runtime environment cannot be classified, audio stays off unless `enabled: true` is set.
- Browsers may keep `AudioContext` suspended until user interaction.
- `performanceMode` is recommended for low-power or high-frequency update scenarios.
- Use `onError` if you need telemetry for non-fatal audio/debugging failures.
<!-- README_SYNC:SECTION_END:production-notes -->

<!-- README_SYNC:SECTION_START:what-youll-hear -->

## What You'll Hear

- Numbers: pitch-centric tones
- Booleans: short click-like cues
- Strings: brighter/longer character
- Objects/arrays: more layered motion
<!-- README_SYNC:SECTION_END:what-youll-hear -->

## Related Docs

- Root project overview: [README](https://github.com/joe-byounghern-kim/zusound/blob/main/README.md)
- Quick start guide: [QUICK_START](https://github.com/joe-byounghern-kim/zusound/blob/main/QUICK_START.md)
- Dev workflow: [DEVELOPMENT](https://github.com/joe-byounghern-kim/zusound/blob/main/DEVELOPMENT.md)
- Demo usage: [demo/README](https://github.com/joe-byounghern-kim/zusound/blob/main/demo/README.md)
- React strict TypeScript demo: [examples/README](https://github.com/joe-byounghern-kim/zusound/blob/main/examples/README.md)
- Operations runbook: [docs/RUNBOOK](https://github.com/joe-byounghern-kim/zusound/blob/main/docs/RUNBOOK.md)

## License

MIT © [joe-byounghern-kim](https://github.com/joe-byounghern-kim)
