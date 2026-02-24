import { describe, expect, it, vi } from 'vitest'
import { scheduleAudioTask, stopAudioScheduler } from '../src/scheduler'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function createMockAudioContext(getCurrentTime: () => number): AudioContext {
  return {
    get currentTime() {
      return getCurrentTime()
    },
  } as unknown as AudioContext
}

describe('scheduler', () => {
  it('runs tasks in ascending time order within horizon', async () => {
    const audioTime = 0
    const ctx = createMockAudioContext(() => audioTime)

    const executed: number[] = []
    scheduleAudioTask(ctx, 0.05, () => executed.push(2))
    scheduleAudioTask(ctx, 0.02, () => executed.push(1))

    await Promise.resolve()
    expect(executed).toEqual([1, 2])
    void audioTime
  })

  it('defers future tasks until they enter the lookahead window', async () => {
    let audioTime = 0
    const ctx = createMockAudioContext(() => audioTime)

    const executed: number[] = []
    scheduleAudioTask(ctx, 1.0, () => executed.push(1))

    await Promise.resolve()
    expect(executed).toEqual([])

    audioTime = 0.95
    await sleep(35)

    expect(executed).toEqual([1])
  })

  it('stops and clears pending tasks', async () => {
    let audioTime = 0
    const ctx = createMockAudioContext(() => audioTime)

    const executed: number[] = []
    scheduleAudioTask(ctx, 1.0, () => executed.push(1))
    await Promise.resolve()
    stopAudioScheduler(ctx)

    audioTime = 2.0
    await sleep(35)
    expect(executed).toEqual([])
  })

  it('continues running subsequent tasks if one task throws', async () => {
    const audioTime = 0
    const ctx = createMockAudioContext(() => audioTime)

    const executed: number[] = []
    scheduleAudioTask(ctx, 0.01, () => {
      throw new Error('boom')
    })
    scheduleAudioTask(ctx, 0.02, () => executed.push(1))

    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    await Promise.resolve()

    expect(executed).toEqual([1])
    expect(debugSpy).toHaveBeenCalled()
    debugSpy.mockRestore()
  })

  it('ignores invalid schedule times and avoids queue churn', async () => {
    const ctx = createMockAudioContext(() => 0)
    const run = vi.fn()

    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    const nanId = scheduleAudioTask(ctx, Number.NaN, run)
    const negativeId = scheduleAudioTask(ctx, -0.1, run)

    await Promise.resolve()

    expect(nanId).toBe(-1)
    expect(negativeId).toBe(-1)
    expect(run).not.toHaveBeenCalled()
    expect(debugSpy).toHaveBeenCalledTimes(2)
    debugSpy.mockRestore()
  })
})
