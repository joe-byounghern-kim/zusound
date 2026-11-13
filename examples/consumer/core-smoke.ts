import { createSonifier, detectChanges } from '@zusound/core'
import type { Change, Sonifier, SonifierOptions } from '@zusound/core'
import type { ZusoundOptions } from 'zusound'

const options: SonifierOptions = { enabled: false, volume: 0.2, debounceMs: 10 }
// zusound options and core options stay interchangeable.
const forwarded: ZusoundOptions = options
const sonifier: Sonifier = createSonifier(forwarded)
const changes: Change[] = detectChanges({ count: 1 }, { count: 0 })
sonifier.play(changes)
sonifier.dispose()
// @ts-expect-error unknown option keys are rejected at compile time
createSonifier({ volum: 0.2 })
