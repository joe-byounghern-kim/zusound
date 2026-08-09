#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const packageDir = resolve(process.cwd(), 'packages/zusound')
const result = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: packageDir,
    encoding: 'utf8',
  })
)

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
]

const actual = result[0].files.map(({ path }) => path).sort()
const wanted = [...expected].sort()
if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
  console.error('[package-check] Unexpected package files')
  console.error(JSON.stringify({ expected: wanted, actual }, null, 2))
  process.exit(1)
}

console.log(`[package-check] OK (${actual.length} files)`)
