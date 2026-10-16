import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'

const checker = resolve('scripts/check-skills.mjs')
const scratch = process.env.JCODE_SCRATCH_DIR ?? tmpdir()
const range = '>=4.0.0 <6.0.0'
const units =
  '`AestheticParams.duration` is seconds. `soundMapping[path].duration` is milliseconds.'

function fixture(t) {
  const root = mkdtempSync(join(scratch, 'zusound-skills-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const base = join(root, '.agents/skills/example')
  function write(path, text) {
    const file = join(root, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  write('packages/zusound/package.json', JSON.stringify({ peerDependencies: { zustand: range } }))
  write(
    '.agents/skills/example/SKILL.md',
    '---\nname: example\ndescription: Test skill.\n---\n\n[Compatibility](references/compatibility.md)\n'
  )
  write('.agents/skills/example/references/compatibility.md', `Zustand support is \`${range}\`.\n`)
  return {
    root,
    base,
    write,
    run: () => spawnSync(process.execPath, [checker], { cwd: root, encoding: 'utf8' }),
  }
}

function rejected(result, pattern) {
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stderr, pattern)
}

test('accepts self-contained links, anchors, HTTPS and reference-style links', (t) => {
  const f = fixture(t)
  f.write(
    '.agents/skills/example/references/config-examples.md',
    `${units}\n[Home](../SKILL.md#example) [web](https://example.com) [local](#units)\n[compat][support]\n[support]: compatibility.md\n`
  )
  const result = f.run()
  assert.equal(result.status, 0, result.stderr)
})

test('rejects a link that stays in the repo but escapes the installed skill', (t) => {
  const f = fixture(t)
  f.write('docs/API.md', '# API')
  f.write('.agents/skills/example/references/escape.md', '[API](../../../../docs/API.md#options)')
  rejected(f.run(), /escapes skill directory/)
})

test('rejects cross-skill relative links', (t) => {
  const f = fixture(t)
  f.write('.agents/skills/other/SKILL.md', '# Other')
  f.write('.agents/skills/example/references/escape.md', '[Other](../../other/SKILL.md)')
  rejected(f.run(), /escapes skill directory/)
})

test('rejects reference-style links escaping the skill', (t) => {
  const f = fixture(t)
  f.write('docs/API.md', '# API')
  f.write(
    '.agents/skills/example/references/escape.md',
    '[API][api]\n\n[api]: ../../../../docs/API.md'
  )
  rejected(f.run(), /escapes skill directory/)
})

test('rejects URL-encoded traversal', (t) => {
  const f = fixture(t)
  f.write('docs/API.md', '# API')
  f.write(
    '.agents/skills/example/references/escape.md',
    '[API](%2e%2e/%2e%2e/%2e%2e/%2e%2e/docs/API.md)'
  )
  rejected(f.run(), /escapes skill directory/)
})

test('rejects symlink targets outside the skill', (t) => {
  const f = fixture(t)
  f.write('docs/API.md', '# API')
  symlinkSync(join(f.root, 'docs/API.md'), join(f.base, 'references/linked.md'))
  f.write('.agents/skills/example/references/config.md', '[API](linked.md)')
  rejected(f.run(), /escapes skill directory/)
})

test('validates nested reference files', (t) => {
  const f = fixture(t)
  f.write('docs/API.md', '# API')
  f.write('.agents/skills/example/references/nested/escape.md', '[API](../../../../../docs/API.md)')
  rejected(f.run(), /escapes skill directory/)
})

test('rejects broken local links', (t) => {
  const f = fixture(t)
  f.write('.agents/skills/example/references/config.md', '[Missing](missing.md)')
  rejected(f.run(), /broken local link/)
})

test('rejects absolute filesystem links and unsupported schemes', async (t) => {
  for (const href of ['/etc/hosts', 'file:///etc/hosts']) {
    await t.test(href, (t) => {
      const f = fixture(t)
      f.write('.agents/skills/example/references/config.md', `[bad](${href})`)
      rejected(f.run(), /filesystem link|unsupported link scheme/)
    })
  }
})

test('requires compatibility to match the actual package peer range', (t) => {
  const f = fixture(t)
  f.write('.agents/skills/example/references/compatibility.md', 'Zustand >=4.5 <6 only.')
  rejected(f.run(), /peer range/)
})

test('reads the peer range instead of hardcoding it', (t) => {
  const f = fixture(t)
  f.write(
    'packages/zusound/package.json',
    JSON.stringify({ peerDependencies: { zustand: '>=5 <6' } })
  )
  rejected(f.run(), /peer range/)
})

test('requires a compatibility reference in every skill', (t) => {
  const f = fixture(t)
  rmSync(join(f.base, 'references/compatibility.md'))
  f.write('.agents/skills/example/SKILL.md', '---\nname: example\ndescription: Test skill.\n---\n')
  f.write('.agents/skills/example/references/other.md', '# Other')
  rejected(f.run(), /compatibility\.md/)
})

test('requires both duration units in each file mentioning duration', async (t) => {
  for (const text of [
    'Tune duration.',
    '`AestheticParams.duration` is seconds.',
    '`soundMapping[path].duration` is milliseconds.',
  ]) {
    await t.test(text, (t) => {
      const f = fixture(t)
      f.write('.agents/skills/example/references/config.md', text)
      rejected(f.run(), /duration units/)
    })
  }
})

test('checks duration units in SKILL.md as well as references', (t) => {
  const f = fixture(t)
  f.write(
    '.agents/skills/example/SKILL.md',
    '---\nname: example\ndescription: Tune duration.\n---\n'
  )
  rejected(f.run(), /duration units/)
})
