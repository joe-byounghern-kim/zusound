---
'@zusound/core': minor
'zusound': minor
---

Split the diffing and Web Audio engine into the new framework-agnostic `@zusound/core` package. `createSonifier()` returns a sonifier with `update(current, prev)`, `play(changes)`, and `dispose()`, and `detectChanges()` exposes the top-level change detector. `zusound` now depends on `@zusound/core` and keeps its existing middleware and subscriber API, options, and types. Subscriber-mode instances now read their options once, on the first enabled update, matching middleware mode; mutating the options object passed to `createZusound()` afterwards no longer changes playback. Enablement is still re-resolved on every subscriber call.
