import { afterEach, describe, expect, it } from 'vitest'
import { resolveDefaultEnabled } from '../src/env'

type GlobalWithDev = typeof globalThis & { __DEV__?: unknown }
type GlobalWithWindow = typeof globalThis & { window?: Window & typeof globalThis }

const originalNodeEnv = process.env.NODE_ENV
const originalDev = (globalThis as GlobalWithDev).__DEV__
const originalWindow = globalThis.window

function setWindow(value: (Window & typeof globalThis) | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(globalThis as GlobalWithWindow, 'window')
    return
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value,
  })
}

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv

  if (originalDev === undefined) {
    Reflect.deleteProperty(globalThis as GlobalWithDev, '__DEV__')
  } else {
    Reflect.set(globalThis as GlobalWithDev, '__DEV__', originalDev)
  }

  setWindow(originalWindow)
})

describe('resolveDefaultEnabled', () => {
  it.each([
    { nodeEnv: 'production', dev: true, hostname: 'localhost', expected: false },
    { nodeEnv: 'development', dev: false, hostname: 'example.com', expected: true },
    { nodeEnv: 'test', dev: false, hostname: 'example.com', expected: true },
  ])(
    'prioritizes $nodeEnv NODE_ENV over __DEV__ and hostname',
    ({ nodeEnv, dev, hostname, expected }) => {
      process.env.NODE_ENV = nodeEnv
      Reflect.set(globalThis as GlobalWithDev, '__DEV__', dev)
      setWindow({ location: { hostname } } as unknown as Window & typeof globalThis)

      expect(resolveDefaultEnabled()).toBe(expected)
    }
  )

  it.each([
    { dev: true, hostname: 'example.com', expected: true },
    { dev: false, hostname: 'localhost', expected: false },
    { dev: 'true', hostname: 'example.com', expected: false },
  ])('falls through unknown NODE_ENV with __DEV__=$dev', ({ dev, hostname, expected }) => {
    process.env.NODE_ENV = 'staging'
    Reflect.set(globalThis as GlobalWithDev, '__DEV__', dev)
    setWindow({ location: { hostname } } as unknown as Window & typeof globalThis)

    expect(resolveDefaultEnabled()).toBe(expected)
  })

  it('returns false for production NODE_ENV', () => {
    process.env.NODE_ENV = 'production'

    expect(resolveDefaultEnabled()).toBe(false)
  })

  it('returns true for test NODE_ENV', () => {
    process.env.NODE_ENV = 'test'

    expect(resolveDefaultEnabled()).toBe(true)
  })

  it('uses __DEV__ when NODE_ENV is not set', () => {
    Reflect.deleteProperty(process.env, 'NODE_ENV')
    Reflect.set(globalThis as GlobalWithDev, '__DEV__', true)

    expect(resolveDefaultEnabled()).toBe(true)
  })

  it('returns false when __DEV__ is false', () => {
    Reflect.deleteProperty(process.env, 'NODE_ENV')
    Reflect.set(globalThis as GlobalWithDev, '__DEV__', false)

    expect(resolveDefaultEnabled()).toBe(false)
  })

  it('falls back to localhost hostname detection', () => {
    Reflect.deleteProperty(process.env, 'NODE_ENV')
    Reflect.deleteProperty(globalThis as GlobalWithDev, '__DEV__')
    setWindow({ location: { hostname: 'localhost' } } as unknown as Window & typeof globalThis)

    expect(resolveDefaultEnabled()).toBe(true)
  })

  it('treats bare IPv6 localhost hostname as local development', () => {
    Reflect.deleteProperty(process.env, 'NODE_ENV')
    Reflect.deleteProperty(globalThis as GlobalWithDev, '__DEV__')
    setWindow({ location: { hostname: '::1' } } as unknown as Window & typeof globalThis)

    expect(resolveDefaultEnabled()).toBe(true)
  })

  it('stays disabled for non-local hostname fallback', () => {
    Reflect.deleteProperty(process.env, 'NODE_ENV')
    Reflect.deleteProperty(globalThis as GlobalWithDev, '__DEV__')
    setWindow({ location: { hostname: 'example.com' } } as unknown as Window & typeof globalThis)

    expect(resolveDefaultEnabled()).toBe(false)
  })
})
