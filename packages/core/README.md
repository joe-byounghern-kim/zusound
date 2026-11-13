# @zusound/core

[![npm version](https://img.shields.io/npm/v/@zusound/core)](https://www.npmjs.com/package/@zusound/core)

Framework-agnostic state diffing and Web Audio cues. This is the engine behind
the [`zusound`](https://www.npmjs.com/package/zusound) Zustand middleware.
Use it directly to add audio feedback to any state container that can hand you
the previous and next state.

If you use Zustand, install `zusound` instead. It depends on this package and
wires it to your store for you.

## Install

```bash
npm install @zusound/core
```

## Usage

Create one sonifier per state source. Call `update()` with each new and
previous snapshot, and call `dispose()` when the source goes away.

```ts
import { createSonifier } from '@zusound/core'

type State = { count: number; status: 'idle' | 'saving' }

let state: State = { count: 0, status: 'idle' }
const sonifier = createSonifier({ enabled: true, volume: 0.2 })

function setState(next: Partial<State>) {
  const prev = state
  state = { ...state, ...next }
  sonifier.update(state, prev)
}

setState({ count: 1 })
sonifier.dispose()
```

To control which changes are played, detect them yourself and pass the result
to `play()`:

```ts
import { createSonifier, detectChanges } from '@zusound/core'

const sonifier = createSonifier({ enabled: true })
const changes = detectChanges({ count: 2, label: 'b' }, { count: 1, label: 'a' })

sonifier.play(changes.filter((change) => change.path === 'count'))
sonifier.dispose()
```

Browsers start audio only after a user gesture. Cues requested before then are
dropped rather than replayed later.

## API

| Export                      | Purpose                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createSonifier(options?)`  | Create a `Sonifier`. Options are the same as `zusound`'s; see the [API reference](https://github.com/joe-byounghern-kim/zusound/blob/main/docs/API.md). |
| `detectChanges(next, prev)` | Return one `Change` per added, removed, or updated top-level key.                                                                                       |
| `resolveDefaultEnabled()`   | Return the default for `enabled`: `true` in recognized development or test environments, otherwise `false`.                                             |
| `sonifierOptionKeys`        | Every option key `createSonifier()` recognizes, for wrappers that validate or forward options.                                                          |
| `version`                   | The package version.                                                                                                                                    |

A `Sonifier` has:

| Member                  | Purpose                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| `enabled`               | Whether it plays cues. Resolved once, when the sonifier is created.           |
| `update(current, prev)` | Diff two snapshots and play a cue for each changed top-level key.             |
| `play(changes)`         | Play cues for changes you already have. Respects `debounceMs`.                |
| `dispose()`             | Cancel pending cues and release audio resources. Safe to call more than once. |

A disabled sonifier holds no audio resources and ignores every call. All
sonifiers share one `AudioContext`, which closes when the last enabled sonifier
is disposed.

## License

MIT © [joe-byounghern-kim](https://github.com/joe-byounghern-kim)
