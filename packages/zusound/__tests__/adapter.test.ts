import { afterEach, describe, expect, it, vi } from 'vitest'
import { attachZusound } from '../src/adapter'
import { cleanupAudio } from '../src/audio'
import * as audio from '../src/audio'
import type { ZusoundAdapter } from '../src/types'

type State = { a: number; b: number }

describe('adapter debounce dedupe ordering', () => {
  afterEach(() => {
    cleanupAudio()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps latest-occurrence chronology when deduplicating debounce batches', async () => {
    vi.useFakeTimers()

    const playSoundSpy = vi.spyOn(audio, 'playSound').mockResolvedValue(undefined)
    let listener: ((current: State, prev: State) => void) | undefined

    const adapter: ZusoundAdapter<State> = {
      getState: () => ({ a: 0, b: 0 }),
      subscribe: (next) => {
        listener = next
        return () => {}
      },
    }

    const handle = attachZusound(adapter, {
      enabled: true,
      debounceMs: 20,
    })

    listener?.({ a: 1, b: 0 }, { a: 0, b: 0 })
    listener?.({ a: 1, b: 1 }, { a: 1, b: 0 })
    listener?.({ a: 2, b: 1 }, { a: 1, b: 1 })

    await vi.advanceTimersByTimeAsync(25)

    expect(playSoundSpy).toHaveBeenCalledTimes(2)
    expect(playSoundSpy.mock.calls[0]?.[0]).toMatchObject({ path: 'b' })
    expect(playSoundSpy.mock.calls[1]?.[0]).toMatchObject({ path: 'a' })
    expect(playSoundSpy.mock.calls[0]?.[1]).toMatchObject({ startOffset: 0 })
    expect(playSoundSpy.mock.calls[1]?.[1]).toMatchObject({ startOffset: 0.04 })

    handle.cleanup()
  })
})
