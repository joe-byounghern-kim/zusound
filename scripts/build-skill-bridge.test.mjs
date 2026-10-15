import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'

const builder = resolve('scripts/build-skill-bridge.mjs')
const generated =
  '<!-- GENERATED FILE: DO NOT EDIT -->\n<!-- Source: .agents/skills/example/SKILL.md -->'
const skill =
  '---\nname: example\ndescription: Test skill.\n---\n\n[Reference](references/nested/config.md)\n'

function fixture(t) {
  const root = mkdtempSync(join(process.env.JCODE_SCRATCH_DIR ?? tmpdir(), 'zusound-bridge-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  function write(path, text) {
    const file = join(root, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  write('.agents/skills/example/SKILL.md', skill)
  write('.agents/skills/example/references/nested/config.md', '# Local reference\n')
  const output = join(root, '.claude/skills')
  return {
    root,
    output,
    write,
    run: () => spawnSync(process.execPath, [builder], { cwd: root, encoding: 'utf8' }),
  }
}

test('emits discoverable SKILL.md with frontmatter first and all nested references', (t) => {
  const f = fixture(t)
  const result = f.run()
  assert.equal(result.status, 0, result.stderr)
  const content = readFileSync(join(f.output, 'example/SKILL.md'), 'utf8')
  assert.ok(content.startsWith('---\nname: example\n'))
  assert.ok(content.includes(generated))
  assert.ok(content.includes('[Reference](references/nested/config.md)'))
  assert.equal(
    readFileSync(join(f.output, 'example/references/nested/config.md'), 'utf8'),
    '# Local reference\n'
  )
  assert.equal(existsSync(join(f.output, 'example.md')), false)
})

test('removes legacy generated flat files and stale generated skill directories only', (t) => {
  const f = fixture(t)
  f.write('.claude/skills/example.md', generated)
  f.write('.claude/skills/old.md', generated)
  f.write('.claude/skills/old/SKILL.md', generated)
  f.write('.claude/skills/old/references/stale.md', 'stale')
  f.write('.claude/skills/personal.md', '# My command')
  f.write('.claude/skills/personal/SKILL.md', '# My skill')
  const result = f.run()
  assert.equal(result.status, 0, result.stderr)
  for (const name of ['example.md', 'old.md', 'old'])
    assert.equal(existsSync(join(f.output, name)), false)
  assert.equal(readFileSync(join(f.output, 'personal.md'), 'utf8'), '# My command')
  assert.equal(readFileSync(join(f.output, 'personal/SKILL.md'), 'utf8'), '# My skill')
})

test('reruns update content and remove stale references without leftover staging files', (t) => {
  const f = fixture(t)
  assert.equal(f.run().status, 0)
  f.write('.claude/skills/example/references/obsolete.md', 'obsolete generated reference')
  f.write('.agents/skills/example/references/nested/config.md', '# Updated\n')
  assert.equal(f.run().status, 0)
  assert.equal(
    readFileSync(join(f.output, 'example/references/nested/config.md'), 'utf8'),
    '# Updated\n'
  )
  assert.equal(existsSync(join(f.output, 'example/references/obsolete.md')), false)
  assert.deepEqual(readdirSync(f.output), ['example'])
})

test('refuses to overwrite a hand-authored skill directory', (t) => {
  const f = fixture(t)
  f.write('.claude/skills/example/SKILL.md', '# User authored')
  const result = f.run()
  assert.equal(result.status, 1)
  assert.match(result.stderr, /not generated|hand-authored/)
  assert.equal(readFileSync(join(f.output, 'example/SKILL.md'), 'utf8'), '# User authored')
})

test('preflights all sources before removing any generated outputs', (t) => {
  const f = fixture(t)
  f.write('.claude/skills/old.md', generated)
  f.write('.agents/skills/broken/references/config.md', '# Missing SKILL.md')
  const result = f.run()
  assert.equal(result.status, 1)
  assert.equal(readFileSync(join(f.output, 'old.md'), 'utf8'), generated)
  assert.equal(existsSync(join(f.output, 'example/SKILL.md')), false)
})
