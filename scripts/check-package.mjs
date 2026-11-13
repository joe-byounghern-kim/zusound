#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const expected = [
  'LICENSE',
  'README.md',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.cts',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.js.map',
  'package.json',
].sort()

let failed = false
for (const directory of ['packages/core', 'packages/zusound']) {
  const result = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: resolve(process.cwd(), directory),
      encoding: 'utf8',
    })
  )

  const actual = result[0].files.map(({ path }) => path).sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`[package-check] Unexpected package files in ${directory}`)
    console.error(JSON.stringify({ expected, actual }, null, 2))
    failed = true
  } else {
    console.log(`[package-check] ${result[0].name} OK (${actual.length} files)`)
  }
}

if (failed) process.exit(1)
