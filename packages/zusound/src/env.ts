/**
 * Runtime environment detection for safe defaults.
 *
 * Determines whether audio should be enabled by default using a
 * progressive detection strategy:
 * 1. NODE_ENV check (production -> off, development/test -> on)
 * 2. __DEV__ global flag (React Native convention)
 * 3. Hostname heuristics (localhost, 127.0.0.1, .local -> on)
 * 4. Unknown environment -> off (safe default)
 */

function isLocalDevelopmentHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  )
}

function readNodeEnv(): string | undefined {
  if (typeof process === 'undefined') return undefined
  return process.env?.NODE_ENV
}

/** Resolve whether audio feedback should be enabled by default. */
export function resolveDefaultEnabled(): boolean {
  const nodeEnv = readNodeEnv()
  if (nodeEnv === 'production') return false
  if (nodeEnv === 'development' || nodeEnv === 'test') return true

  const maybeDev = (globalThis as { __DEV__?: unknown }).__DEV__
  if (typeof maybeDev === 'boolean') return maybeDev

  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname
    if (typeof hostname === 'string' && hostname.length > 0) {
      return isLocalDevelopmentHost(hostname)
    }
  }

  return false
}
