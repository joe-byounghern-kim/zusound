# Symptom branches

## Type errors after upgrading to 0.3.x

The 0.3.0 declarations expose cleanup metadata already present at runtime.
Use curried `create<State>()(...)` or `createStore<State>()(...)` and infer the
`zusound(initializer)` result. Only the original initializer can have the plain
`StateCreator<State, [], []>` annotation, not the enhanced result. Do not use
casts or `skipLibCheck` to suppress these errors.

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { zusound } from 'zusound'

type State = { count: number; increment: () => void }
const initializer: StateCreator<State, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})
const enhanced = zusound(initializer, { enabled: true, volume: 0.1 })
export const useCounterStore = create<State>()(enhanced)
export function disposeCounterAudio(): void {
  useCounterStore.zusoundCleanup()
}
```

This example uses modern named factories. Check the exact Zustand version and
the local [compatibility forms](compatibility.md) for default imports on 4.0–4.2
and the outermost-Zusound exception on exactly 4.0. Further reading:
[0.3.0 changelog](https://github.com/joe-byounghern-kim/zusound/blob/main/packages/zusound/CHANGELOG.md#030).

## No audio ever

An update triggered during mount is not an audible-playback reproduction. It can run before browser activation while the audio context is suspended. Confirm its state result, then reproduce with a direct click or tap that invokes the same known action.

1. **Disabled environment:** inspect the final options. Set `enabled: true` only for the development reproduction. Production and unknown environments default off.
2. **Suspended context:** use a direct click or tap that invokes the known store action, then retry. Check browser and device mute settings after the state action is confirmed.
3. **Incorrect wiring:** middleware must wrap the initializer. Subscriber mode must call `store.subscribe(zs)` with a fresh instance that has not been cleaned up.
4. **No detected change:** verify an immutable update changes a top-level key. Nested in-place mutation with the same top-level reference can be missed.

## The first action is quiet

Repeat the same direct gesture after confirming it changed state. A browser can require user activation before resuming audio. Record this as a browser activation observation, not as a failed store action.

## Too many or delayed cues

Inspect duplicate subscriptions and update loops first. Then increase `debounceMs` in milliseconds. Debounce is trailing-edge and retains the last descriptor per top-level path. It is not a net diff or a global rate limiter.

## The cue has the wrong character

Inspect mapping precedence: defaults, `aesthetics`, `mapChangeToAesthetics`, then `soundMapping[path]`. A path mapping wins last. `AestheticParams.duration` is seconds, while `soundMapping[path].duration` is milliseconds. A mapping `volume` is clamped to `0..1`; keep the global `volume` option in that range yourself.

## Stop condition

Escalate with the reproducible action, final options, integration mode, browser activation result, lifecycle state, and consumer typecheck/test/build evidence. Do not report audible success unless a person actually listened.
