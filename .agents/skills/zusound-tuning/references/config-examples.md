# Typed profiles, precedence, and duration units

## Base profile

```typescript
import type { ZusoundOptions } from 'zusound'

export const calmProfile: ZusoundOptions = {
  enabled: true,
  volume: 0.1,
  debounceMs: 60,
  aesthetics: {
    pleasantness: 0.85,
    brightness: 0.45,
    arousal: 0.35,
    valence: 0.75,
    simultaneity: 0.9,
    duration: 0.16,
  },
}
```

`aesthetics.duration: 0.16` is **seconds**.

## Path-specific override

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { zusound } from 'zusound'

type UploadState = {
  progress: number
  advance: () => void
}

const uploadState: StateCreator<UploadState, [], []> = (set) => ({
  progress: 0,
  advance: () => set((state) => ({ progress: state.progress + 1 })),
})

const enhancedUploadState = zusound(uploadState, {
  enabled: true,
  volume: 0.1,
  aesthetics: { duration: 0.16, brightness: 0.45 },
  soundMapping: {
    progress: { waveform: 'sine', duration: 80, volume: 0.5 },
  },
})

export const useUploadStore = create<UploadState>()(enhancedUploadState)

export function disposeUploadStore(): void {
  useUploadStore.zusoundCleanup()
}
```

`soundMapping.progress.duration: 80` is **milliseconds** and wins for `progress`. Resolution order is defaults, static `aesthetics`, dynamic `mapChangeToAesthetics`, then `soundMapping[path]`. A mapping `timbre` wins over its `waveform`; mapping volume is clamped to `0..1`. Keep global `volume` in that range yourself.
