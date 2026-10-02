import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

const script = resolve('scripts/sync-readme.mjs')
const scratch = process.env.JCODE_SCRATCH_DIR ?? tmpdir()
const ids = ['install', 'quick-start', 'runtime-notes']

function section(id, text) {
  return `<!-- README_SYNC:SECTION_START:${id} -->\n\n${text}\n\n<!-- README_SYNC:SECTION_END:${id} -->\n`
}

function readme(label, order = ids) {
  return `# ${label}\n\n${order.map((id) => section(id, `${label} ${id}`)).join('\n')}\n## Links\n\n${label} links\n`
}

function fixture(source, target, run) {
  const directory = mkdtempSync(join(scratch, 'zusound-readme-test-'))
  try {
    mkdirSync(join(directory, 'packages/zusound'), { recursive: true })
    writeFileSync(join(directory, 'packages/zusound/README.md'), source)
    writeFileSync(join(directory, 'README.md'), target)
    const invoke = (...args) =>
      spawnSync(process.execPath, [script, ...args], { cwd: directory, encoding: 'utf8' })
    run(invoke, () => readFileSync(join(directory, 'README.md'), 'utf8'))
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('syncs only onboarding sections and preserves repository-specific content and order', () => {
  const target = readme('Repository', [...ids].reverse())
  fixture(readme('Package'), target, (invoke, readTarget) => {
    const drift = invoke('--check')
    assert.equal(drift.status, 1, drift.stdout + drift.stderr)
    assert.match(drift.stderr, /README drift detected/)
    assert.equal(readTarget(), target, 'check mode must not write')

    const sync = invoke()
    assert.equal(sync.status, 0, sync.stdout + sync.stderr)
    assert.equal(
      readTarget(),
      target.replace(/Repository (install|quick-start|runtime-notes)/g, 'Package $1')
    )
    assert.equal(invoke('--check').status, 0)
    assert.match(invoke().stdout, /already synchronized/)
  })
})

test('checks synchronized onboarding without requiring duplicated API tables', () => {
  fixture(readme('Package'), readme('Package'), (invoke) => {
    const result = invoke('--check')
    assert.equal(result.status, 0, result.stdout + result.stderr)
  })
})

test('normalizes CRLF onboarding without changing unrelated content', () => {
  fixture(
    readme('Package').replaceAll('\n', '\r\n'),
    readme('Repository'),
    (invoke, readTarget) => {
      assert.equal(invoke().status, 0)
      assert.ok(!readTarget().includes('\r'))
      assert.match(readTarget(), /Repository links/)
    }
  )
})

for (const [name, malformed, message] of [
  ['missing', readme('Package', ids.slice(1)), /missing required section 'install'/],
  ['duplicate', readme('Package') + section('install', 'again'), /duplicate section id 'install'/],
  ['unknown', readme('Package') + section('zusound-options', 'old table'), /unknown section id/],
  [
    'mismatched',
    readme('Package').replace('SECTION_END:install', 'SECTION_END:quick-start'),
    /does not match/,
  ],
  [
    'unclosed',
    readme('Package').replace('<!-- README_SYNC:SECTION_END:runtime-notes -->', ''),
    /missing end marker/,
  ],
  [
    'nested',
    readme('Package').replace('Package install', section('quick-start', 'nested')),
    /nested start marker/,
  ],
]) {
  test(`rejects ${name} section markers without writing the target`, () => {
    const target = readme('Repository')
    fixture(malformed, target, (invoke, readTarget) => {
      const result = invoke()
      assert.equal(result.status, 2)
      assert.match(result.stderr, message)
      assert.equal(readTarget(), target)
    })
  })
}
