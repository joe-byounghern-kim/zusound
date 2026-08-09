#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const workflowsDir = resolve(root, '.github/workflows')
const workflows = readdirSync(workflowsDir)
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
  .sort()

for (const workflow of workflows) {
  execFileSync('action-validator', [`.github/workflows/${workflow}`], {
    cwd: root,
    stdio: 'inherit',
  })
}

execFileSync('validate-dependabot-yaml', ['.github/dependabot.yml'], {
  cwd: root,
  stdio: 'inherit',
})

console.log(`[automation-check] OK (${workflows.length} workflows and Dependabot config)`)
