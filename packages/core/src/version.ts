/**
 * Build-time version injection.
 *
 * `__ZUSOUND_VERSION__` is replaced by tsup's `define` config during build
 * with the package.json version string. In development (unbundled), falls
 * back to '0.0.0-dev'.
 */

declare const __ZUSOUND_VERSION__: string | undefined

const fallbackVersion = '0.0.0-dev'

export const version: string =
  typeof __ZUSOUND_VERSION__ === 'string' && __ZUSOUND_VERSION__.length > 0
    ? __ZUSOUND_VERSION__
    : fallbackVersion
