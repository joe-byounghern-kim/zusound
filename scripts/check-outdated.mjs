#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const allowed = new Map([
  ['@types/node', /^24\./],
  ['typescript', /^5\.9\./],
])
const pnpmCli = process.env.npm_execpath
if (!pnpmCli) {
  console.error('[dependency-check] Run this checker through pnpm deps:check')
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  [pnpmCli, '--reporter=silent', 'outdated', '--recursive', '--format', 'json'],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
  }
)

if (result.error || ![0, 1].includes(result.status)) {
  console.error(
    `[dependency-check] Unable to run pnpm outdated: ${result.error?.message ?? `exit ${result.status}`}`
  )
  process.exit(1)
}

let outdated
try {
  outdated = result.stdout.trim() ? JSON.parse(result.stdout) : {}
} catch {
  console.error('[dependency-check] pnpm outdated did not return valid JSON')
  if (result.stdout.trim()) console.error(result.stdout.trim())
  process.exit(1)
}

const names = Object.keys(outdated).sort()
const unexpected = names.filter((name) => !allowed.has(name))
const missing = [...allowed.keys()].filter((name) => !(name in outdated))
const invalid = names.filter((name) => {
  const entry = outdated[name]
  const currentPattern = allowed.get(name)
  return currentPattern && (!currentPattern.test(entry.current) || entry.current !== entry.wanted)
})

if (unexpected.length > 0 || missing.length > 0 || invalid.length > 0) {
  console.error('[dependency-check] Outdated dependency allowlist mismatch')
  console.error(JSON.stringify({ unexpected, missing, invalid, outdated }, null, 2))
  process.exit(1)
}

console.log(
  `[dependency-check] OK (${names.map((name) => `${name}=${outdated[name].current}`).join(', ')})`
)
