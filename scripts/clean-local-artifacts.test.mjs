import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { artifactTargets } from './clean-local-artifact-targets.mjs'

const sourceScriptPath = fileURLToPath(new URL('./clean-local-artifacts.mjs', import.meta.url))
const sourceTargetsPath = fileURLToPath(
  new URL('./clean-local-artifact-targets.mjs', import.meta.url)
)

const approvedTargets = [
  'dist',
  'packages/zusound/dist',
  'packages/zusound/coverage',
  'examples/dist',
  'demo/dist-site',
  '.turbo',
  'examples/.turbo',
  'packages/zusound/.turbo',
  '.omx',
  '.omc',
  '.reports',
  '.save',
  '.sisyphus',
  '.claude',
  'codemaps',
  'tasks',
]

const protectedTargets = [
  '.env',
  '.env.example',
  '.idea/settings.json',
  '.vscode/settings.json',
  '.cursorrules',
  'node_modules/keep.txt',
  'package.json',
  'README.md',
]

function runCleanup(scriptPath, ...args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
  })
}

test('cleanup targets exactly match the approved artifact allowlist', () => {
  assert.deepEqual(artifactTargets, approvedTargets)
})

test('cleanup recursively removes approved artifacts and preserves project files', () => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zusound-cleanup-'))
  const sandboxScript = path.join(sandboxRoot, 'scripts/clean-local-artifacts.mjs')
  const sandboxTargets = path.join(sandboxRoot, 'scripts/clean-local-artifact-targets.mjs')

  try {
    fs.mkdirSync(path.dirname(sandboxScript), { recursive: true })
    fs.copyFileSync(sourceScriptPath, sandboxScript)
    fs.copyFileSync(sourceTargetsPath, sandboxTargets)

    for (const target of approvedTargets) {
      const targetPath = path.join(sandboxRoot, target)
      fs.mkdirSync(targetPath, { recursive: true })
      fs.writeFileSync(path.join(targetPath, 'sentinel.txt'), 'fixture')
    }
    for (const target of protectedTargets) {
      const targetPath = path.join(sandboxRoot, target)
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.writeFileSync(targetPath, 'fixture')
    }

    const preview = runCleanup(sandboxScript, '--dry-run')

    assert.equal(preview.status, 0, preview.stderr)
    for (const target of approvedTargets) {
      assert.match(preview.stdout, new RegExp(`^- ${target.replaceAll('.', '\\.')}$`, 'm'))
      assert.equal(fs.existsSync(path.join(sandboxRoot, target)), true)
    }

    const cleanup = runCleanup(sandboxScript)

    assert.equal(cleanup.status, 0, cleanup.stderr)
    for (const target of approvedTargets) {
      assert.equal(
        fs.existsSync(path.join(sandboxRoot, target)),
        false,
        `${target} should be removed`
      )
    }
    for (const target of protectedTargets) {
      assert.equal(
        fs.existsSync(path.join(sandboxRoot, target)),
        true,
        `${target} should be preserved`
      )
    }

    const secondPreview = runCleanup(sandboxScript, '--dry-run')

    assert.equal(secondPreview.status, 0, secondPreview.stderr)
    assert.match(secondPreview.stdout, /no local artifacts matched the cleanup allowlist/i)
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true })
  }
})
