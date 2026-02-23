import { describe, expect, it, vi, beforeEach } from 'vitest'
import defaultCreateStore, { createStore as namedCreateStore } from 'zustand/vanilla'

// Zustand < 4.3 exported `createStore` as default from 'zustand/vanilla'
const createStore = namedCreateStore ?? defaultCreateStore
import * as dissonance from '../src/dissonance'
import { zusound } from '../src/middleware'
import { cleanupAudio } from '../src/audio'

type CounterState = {
  count: number
  inc: () => void
}
  ; (globalThis as any).window ??= globalThis

describe('performanceMode integration', () => {
  beforeEach(() => {
    cleanupAudio()
    vi.clearAllMocks()
  })

  it('threads performanceMode through middleware and avoids dissonance computation', () => {
    const spy = vi.spyOn(dissonance, 'intervalDissonance')

    const mockAudioContext = {
      state: 'running',
      currentTime: 0,
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createPeriodicWave: vi.fn(() => ({}) as PeriodicWave),
      createOscillator: vi.fn(() => ({
        frequency: { setValueAtTime: vi.fn() },
        setPeriodicWave: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      destination: {},
    }

    const audioContextConstructor = vi.fn(function () {
      return mockAudioContext
    })

    Object.defineProperty(window, 'AudioContext', {
      writable: true,
      value: audioContextConstructor,
    })

    const store = createStore<CounterState>(
      zusound(
        (set) => ({
          count: 0,
          inc: () => set((state) => ({ count: state.count + 1 })),
        }),
        {
          enabled: true,
          performanceMode: true,
          aesthetics: {
            pleasantness: 0.5,
            brightness: 0.5,
            arousal: 0.5,
            valence: 0.5,
            simultaneity: 1,
            baseMidi: 69,
          },
        }
      )
    )

    store.getState().inc()

    expect(window.AudioContext).toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
  })
})
