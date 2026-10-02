# zusound

[![npm version](https://img.shields.io/npm/v/zusound)](https://www.npmjs.com/package/zusound)

Optional audio feedback for Zustand state changes, using browser Web Audio.
Hear small cues while developing or add deliberate, opt-in feedback to your app.
Audio is created lazily, with no runtime dependencies beyond the Zustand peer.

[Try the interactive demo](https://joe-byounghern-kim.github.io/zusound/).

<!-- README_SYNC:SECTION_START:install -->

## Install

```bash
npm install zusound zustand
```

Supports Zustand `>=4.0.0 <6.0.0`. The example uses named imports from Zustand
`>=4.5` and 5. For exactly 4.0, see the [legacy imports and composition order](https://github.com/joe-byounghern-kim/zusound/blob/main/docs/API.md#zustand-40-ordering-exception).

<!-- README_SYNC:SECTION_END:install -->

<!-- README_SYNC:SECTION_START:quick-start -->

## Quick start

Wrap one store initializer. Set `enabled` explicitly while testing and start at
low volume. Keep the enhanced initializer inferred so cleanup stays typed.

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

// Wire this to a browser click or tap handler.
export function incrementFromUserGesture(): void {
  useCounterStore.getState().increment()
}

// Call at permanent store disposal, not after each update or component render.
export function disposeCounterAudio(): void {
  useCounterStore.zusoundCleanup()
}
```

Click or tap to trigger `incrementFromUserGesture()`. Confirm that `count` changes
before checking the cue. Browsers may suspend audio until a direct user gesture.

<!-- README_SYNC:SECTION_END:quick-start -->

<!-- README_SYNC:SECTION_START:runtime-notes -->

## Keep in mind

- Audio is optional. Keep visual feedback and let people choose enablement and volume.
- Recognized development/test environments default on. Production and unknown
  environments default off. Use `{ enabled: true }` for deliberate feedback.
- Changes are detected at top-level keys. Replace changed objects and arrays
  immutably rather than mutating nested values in place.
- `store.zusoundCleanup()` detaches middleware audio and cancels pending work.
  The Zustand store remains usable. Cleanup is idempotent.
- For a separate subscriber attachment, use a fresh `createZusound()` instance
  and dispose both `unsubscribe()` and `instance.cleanup()`.

<!-- README_SYNC:SECTION_END:runtime-notes -->

## Reference and help

- [API reference](https://github.com/joe-byounghern-kim/zusound/blob/main/docs/API.md):
  all options and types, subscriber and React integration, middleware composition,
  debounce behavior, duration units, and non-fatal diagnostics.
- [Consumer skills](https://github.com/joe-byounghern-kim/zusound/blob/main/.agents/README.md):
  guided onboarding for an existing store, debugging, and tuning.
- [Source and contributing](https://github.com/joe-byounghern-kim/zusound/blob/main/CONTRIBUTING.md).
- [Report an issue](https://github.com/joe-byounghern-kim/zusound/issues).

## License

MIT © [joe-byounghern-kim](https://github.com/joe-byounghern-kim)
