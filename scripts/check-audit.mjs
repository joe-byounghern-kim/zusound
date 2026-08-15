#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const severities = ['info', 'low', 'moderate', 'high', 'critical']
const pnpmCli = process.env.npm_execpath
if (!pnpmCli) {
  console.error('[security-check] Run this checker through pnpm security:check')
  process.exit(1)
}

const result = spawnSync(process.execPath, [pnpmCli, '--reporter=silent', 'audit', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
})

if (result.error) {
  console.error(`[security-check] Unable to run pnpm audit: ${result.error.message}`)
  process.exit(1)
}

let report
try {
  report = JSON.parse(result.stdout)
} catch {
  console.error('[security-check] pnpm audit did not return valid JSON')
  if (result.stdout.trim()) console.error(result.stdout.trim())
  if (result.stderr.trim()) console.error(result.stderr.trim())
  process.exit(1)
}

const vulnerabilities = report.metadata?.vulnerabilities
const invalid = severities.filter(
  (severity) => !Number.isInteger(vulnerabilities?.[severity]) || vulnerabilities[severity] !== 0
)
const advisoryCount = Object.keys(report.advisories ?? {}).length

if (result.status !== 0 || invalid.length > 0 || advisoryCount > 0) {
  console.error('[security-check] Vulnerabilities detected or audit metadata is incomplete')
  console.error(JSON.stringify({ status: result.status, vulnerabilities, advisoryCount }, null, 2))
  process.exit(1)
}

console.log(`[security-check] OK (${severities.map((severity) => `${severity}=0`).join(', ')})`)
