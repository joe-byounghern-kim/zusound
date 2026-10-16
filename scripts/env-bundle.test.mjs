import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import test from 'node:test'

// Exercise the same esbuild installation that the package's existing tsup build uses.
const requirePackage = createRequire(new URL('../packages/zusound/package.json', import.meta.url))
const requireTsup = createRequire(requirePackage.resolve('tsup'))
const { buildSync } = requireTsup('esbuild')
const entryPoint = fileURLToPath(new URL('../packages/zusound/src/env.ts', import.meta.url))

function bundle(nodeEnv, minify = false) {
  const { outputFiles } = buildSync({
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'envBundle',
    // Browser builds otherwise inject NODE_ENV automatically. Neutral keeps the
    // no-define case genuinely un-replaced while still running without process.
    platform: nodeEnv === undefined ? 'neutral' : 'browser',
    define: nodeEnv === undefined ? {} : { 'process.env.NODE_ENV': JSON.stringify(nodeEnv) },
    minify,
  })
  return outputFiles[0].text
}

function resolveInBrowser(code, hostname, globals = {}) {
  const context = { window: { location: { hostname } }, ...globals }
  assert.equal(runInNewContext('typeof process', context), 'undefined')
  return runInNewContext(`${code}\nenvBundle.resolveDefaultEnabled()`, context)
}

for (const minify of [false, true]) {
  test(`production define disables localhost without process (minify=${minify})`, () => {
    assert.equal(
      resolveInBrowser(bundle('production', minify), 'localhost', { __DEV__: true }),
      false
    )
  })

  for (const nodeEnv of ['development', 'test']) {
    test(`${nodeEnv} define enables a nonlocal host without process (minify=${minify})`, () => {
      assert.equal(
        resolveInBrowser(bundle(nodeEnv, minify), 'example.com', { __DEV__: false }),
        true
      )
    })
  }
}

const unconfiguredBundle = bundle()

for (const { hostname, globals, expected } of [
  { hostname: 'localhost', globals: {}, expected: true },
  { hostname: 'example.com', globals: {}, expected: false },
  { hostname: 'example.com', globals: { __DEV__: true }, expected: true },
  { hostname: 'localhost', globals: { __DEV__: false }, expected: false },
  { hostname: 'example.com', globals: { __DEV__: 'true' }, expected: false },
]) {
  test(`no process or define safely resolves ${hostname} with ${JSON.stringify(globals)}`, () => {
    assert.equal(resolveInBrowser(unconfiguredBundle, hostname, globals), expected)
  })
}

test('no process, define, or window stays disabled', () => {
  assert.equal(runInNewContext(`${unconfiguredBundle}\nenvBundle.resolveDefaultEnabled()`), false)
})

for (const process of [{}, { env: {} }]) {
  test(`incomplete process ${JSON.stringify(process)} safely falls back to hostname`, () => {
    assert.equal(
      runInNewContext(`${unconfiguredBundle}\nenvBundle.resolveDefaultEnabled()`, {
        process,
        window: { location: { hostname: 'localhost' } },
      }),
      true
    )
  })
}
