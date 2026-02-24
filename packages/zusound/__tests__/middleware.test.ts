/**
 * Zusound Middleware Tests
 * Basic tests for core functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import defaultCreateStore, { createStore as namedCreateStore, type StoreApi } from 'zustand/vanilla'

// Zustand < 4.3 exported `createStore` as default from 'zustand/vanilla'
const createStore = namedCreateStore ?? defaultCreateStore
import { zusound } from '../src/middleware'
import { attachZusound, createZusound } from '../src/adapter'
import { cleanupAudio } from '../src/audio'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function waitForAssert(
  assertion: () => void,
  timeoutMs = 1000,
  intervalMs = 10
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      assertion()
      return
    } catch {
      await sleep(intervalMs)
    }
  }
  assertion()
}

type CounterState = {
  count: number
  increment: () => void
}
  ; (globalThis as any).window ??= globalThis

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  createPeriodicWave: vi.fn(() => ({}) as PeriodicWave),
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    setPeriodicWave: vi.fn(),
    connect: vi.fn(),
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
  })),
  destination: {},
}

// Mock global AudioContext
const audioContextConstructor = vi.fn(function () {
  return mockAudioContext
})

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: audioContextConstructor,
})

describe('Zusound Middleware', () => {
  beforeEach(() => {
    cleanupAudio()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupAudio()
    vi.clearAllMocks()
  })

  it('should create a store without breaking functionality', () => {
    const store = createStore<CounterState>(
      zusound((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))
    )

    expect(store.getState().count).toBe(0)
    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })

  it('should support zero-arg initializer middleware form', () => {
    const store = createStore<CounterState>(
      zusound(() => ({
        count: 0,
        increment: () => { },
      }))
    )

    expect(store.getState().count).toBe(0)
    expect(window.AudioContext).not.toHaveBeenCalled()
  })

  it('should support zero-arg initializer middleware form with options', () => {
    const store = createStore<CounterState>(
      zusound(
        () => ({
          count: 0,
          increment: () => { },
        }),
        { enabled: true }
      )
    )

    expect(store.getState().count).toBe(0)
    store.setState({ count: 1, increment: store.getState().increment })
    expect(window.AudioContext).toHaveBeenCalledTimes(1)
  })

  it('should disable audio when enabled is false', () => {
    const store = createStore<CounterState>(
      zusound(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        { enabled: false }
      )
    )

    store.getState().increment()

    // AudioContext should not be created when disabled
    expect(window.AudioContext).not.toHaveBeenCalled()
  })

  it('should respect volume setting', () => {
    const store = createStore<CounterState>(
      zusound(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        { enabled: true, volume: 0.8 }
      )
    )

    // Trigger a state change
    store.getState().increment()
    expect(window.AudioContext).toHaveBeenCalled()
  })

  it('should provide cleanup function', () => {
    const store = createStore<CounterState>(
      zusound((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))
    )

    // Should have cleanup function attached
    expect(typeof (store as any).zusoundCleanup).toBe('function')
  })

  it('should report subscription attach failures through onError and return safe cleanup', () => {
    const attachCleanup = vi.fn()
    const onError = vi.fn()
    const subscribeError = new Error('subscribe failed')

    const handle = attachZusound(
      {
        getState: () => ({ count: 0 }),
        subscribe: () => {
          throw subscribeError
        },
        attachCleanup,
      },
      {
        enabled: true,
        onError,
      }
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]?.[0]).toBe(subscribeError)
    expect(onError.mock.calls[0]?.[1]).toMatchObject({ stage: 'state-change-processing' })

    expect(typeof handle.cleanup).toBe('function')
    expect(() => handle.cleanup()).not.toThrow()
    expect(attachCleanup).toHaveBeenCalledTimes(1)
  })

  it('releases attached audio resources when middleware initializer throws', () => {
    const failingInitializer = (): CounterState => {
      throw new Error('initializer failed')
    }

    expect(() => createStore<CounterState>(zusound(failingInitializer, { enabled: true }))).toThrow(
      'initializer failed'
    )

    const store = createStore<CounterState>(
      zusound(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        { enabled: true }
      )
    )

    store.getState().increment()
      ; (store as any).zusoundCleanup()

    expect(mockAudioContext.close).toHaveBeenCalledTimes(1)
  })

  it('should handle custom sound mapping', () => {
    const customMapping = {
      count: { frequency: 440, waveform: 'sine' as const },
    }

    const store = createStore<CounterState>(
      zusound(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        {
          enabled: true,
          soundMapping: customMapping,
        }
      )
    )

    store.getState().increment()
    expect(window.AudioContext).toHaveBeenCalled()
  })

  it('should handle debouncing', async () => {
    const store = createStore<CounterState>(
      zusound(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        {
          enabled: true,
          debounceMs: 100,
        }
      )
    )

    // Trigger multiple rapid changes
    store.getState().increment()
    store.getState().increment()
    store.getState().increment()

    // AudioContext should only be called once after debounce
    expect(window.AudioContext).not.toHaveBeenCalled()
    await sleep(130)
    expect(window.AudioContext).toHaveBeenCalledTimes(1)
  })

  it('should clear pending debounce playback on cleanup and allow repeated cleanup', async () => {
    const store = createStore<CounterState>(
      zusound(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        {
          enabled: true,
          debounceMs: 100,
        }
      )
    )

    store.getState().increment()
      ; (store as any).zusoundCleanup()

    await sleep(170)

    expect(window.AudioContext).not.toHaveBeenCalled()
    expect(() => (store as any).zusoundCleanup()).not.toThrow()
  })

  it('keeps the shared audio engine alive until all stores are cleaned up', () => {
    type CounterStoreWithCleanup = StoreApi<CounterState> & {
      zusoundCleanup: () => void
    }

    const createCounterStore = (): CounterStoreWithCleanup =>
      createStore<CounterState>(
        zusound(
          (set) => ({
            count: 0,
            increment: () => set((state) => ({ count: state.count + 1 })),
          }),
          { enabled: true }
        )
      ) as unknown as CounterStoreWithCleanup

    const storeA = createCounterStore()
    const storeB = createCounterStore()

    storeA.getState().increment()
    storeB.getState().increment()
    expect(window.AudioContext).toHaveBeenCalledTimes(1)
    storeA.zusoundCleanup()
    storeB.getState().increment()
    expect(window.AudioContext).toHaveBeenCalledTimes(1)
    storeB.zusoundCleanup()
  })

  it('should disable in production by default', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const store = createStore<CounterState>(
      zusound((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))
    )

    store.getState().increment()

    // Should not create AudioContext in production
    expect(window.AudioContext).not.toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })

  it('should allow forcing enable in production', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const store = createStore<CounterState>(
      zusound(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        { enabled: true } // Explicitly enabled
      )
    )

    store.getState().increment()
    expect(window.AudioContext).toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })

  describe('Subscriber Usage', () => {
    it('keeps subscriber invocation in listener mode for function-valued states', () => {
      const configuredZusound = createZusound({ enabled: false })
      const invoke = configuredZusound as unknown as (current: unknown, prev: unknown) => unknown

      const result = invoke(() => 1, {
        count: 0,
      })

      expect(result).toBeUndefined()
      configuredZusound.cleanup()
    })

    it('treats initializer + undefined options as middleware invocation', () => {
      const configuredZusound = createZusound({ enabled: false })
      const invoke = configuredZusound as unknown as (
        initializer: (set: unknown) => unknown,
        options: unknown
      ) => unknown

      const result = invoke(() => ({ count: 0 }), undefined)

      expect(typeof result).toBe('function')
      configuredZusound.cleanup()
    })

    it('should function correctly when passed directly to store.subscribe', () => {
      const store = createStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))

      // Use zusound as a subscriber
      const unsubscribe = store.subscribe(zusound)

      expect(store.getState().count).toBe(0)

      // Trigger a change
      store.getState().increment()
      expect(store.getState().count).toBe(1)

      // AudioContext should have been initialized
      expect(window.AudioContext).toHaveBeenCalled()

      unsubscribe()
    })

    it('should not play sound if disabled in environment when used as subscriber', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const store = createStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))

      const unsubscribe = store.subscribe(zusound)

      store.getState().increment()

      // Should not create AudioContext in production for subscriber
      expect(window.AudioContext).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
      unsubscribe()
    })

    it('supports configured subscriber via createZusound with debounce', async () => {
      const store = createStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))

      const configuredZusound = createZusound({ enabled: true, debounceMs: 100, volume: 0.8 })
      const unsubscribe = store.subscribe(configuredZusound)

      store.getState().increment()
      store.getState().increment()
      store.getState().increment()

      expect(window.AudioContext).not.toHaveBeenCalled()
      await sleep(140)
      expect(window.AudioContext).toHaveBeenCalledTimes(1)

      unsubscribe()
      configuredZusound.cleanup()
    })

    it('keeps subscriber audio alive when middleware cleanup runs', () => {
      type CounterStoreWithCleanup = StoreApi<CounterState> & {
        zusoundCleanup: () => void
      }

      const middlewareStore = createStore<CounterState>(
        zusound(
          (set) => ({
            count: 0,
            increment: () => set((state) => ({ count: state.count + 1 })),
          }),
          { enabled: true }
        )
      ) as unknown as CounterStoreWithCleanup

      const subscriberStore = createStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))

      const configuredZusound = createZusound({ enabled: true })
      const unsubscribe = subscriberStore.subscribe(configuredZusound)

      middlewareStore.getState().increment()
      subscriberStore.getState().increment()
      expect(window.AudioContext).toHaveBeenCalledTimes(1)

      middlewareStore.zusoundCleanup()
      subscriberStore.getState().increment()
      expect(window.AudioContext).toHaveBeenCalledTimes(1)

      unsubscribe()
      configuredZusound.cleanup()
    })

    it('releases subscriber audio engine on cleanup', () => {
      const subscriberStore = createStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))

      const configuredZusound = createZusound({ enabled: true })
      const unsubscribe = subscriberStore.subscribe(configuredZusound)

      subscriberStore.getState().increment()
      expect(window.AudioContext).toHaveBeenCalledTimes(1)

      unsubscribe()
      configuredZusound.cleanup()

      const middlewareStore = createStore<CounterState>(
        zusound(
          (set) => ({
            count: 0,
            increment: () => set((state) => ({ count: state.count + 1 })),
          }),
          { enabled: true }
        )
      )

      middlewareStore.getState().increment()
      expect(window.AudioContext).toHaveBeenCalledTimes(2)
    })

    it('forwards middleware onError option', async () => {
      const onError = vi.fn()
      mockAudioContext.state = 'suspended'
      mockAudioContext.resume.mockRejectedValueOnce(new Error('resume-failed'))

      const store = createStore<CounterState>(
        zusound(
          (set) => ({
            count: 0,
            increment: () => set((state) => ({ count: state.count + 1 })),
          }),
          { enabled: true, onError }
        )
      )

      store.getState().increment()
      await waitForAssert(() => {
        expect(onError).toHaveBeenCalled()
      })
      expect(onError.mock.calls[0]?.[1]).toMatchObject({ stage: 'audio-resume' })

      mockAudioContext.state = 'running'
      mockAudioContext.resume.mockResolvedValue(undefined)
    })
  })
})
