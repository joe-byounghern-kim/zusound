import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const scratch = process.env.JCODE_SCRATCH_DIR ?? tmpdir()

function checkMarkdown(markdown) {
  const directory = mkdtempSync(join(scratch, 'zusound-example-test-'))
  try {
    const file = join(directory, 'example.md')
    writeFileSync(file, markdown)
    return spawnSync(process.execPath, ['scripts/check-examples.mjs', '--file', file], {
      encoding: 'utf8',
    })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('compiles valid examples as separate modules', () => {
  const result = checkMarkdown(
    '```typescript\nconst count: number = 1\n```\n\n```ts\nconst count: string = "one"\n```\n'
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /2 examples/)
})

test('rejects a type error and identifies the source example', () => {
  const result = checkMarkdown('```typescript\nconst count: number = "bad"\n```\n')
  assert.equal(result.status, 1)
  assert.match(result.stdout + result.stderr, /TS2322/)
  assert.match(result.stdout + result.stderr, /example\.md.*example 1/)
})

test('rejects examples that depend on declarations in another fence', () => {
  const result = checkMarkdown(
    '```ts\nconst store = { count: 1 }\n```\n\n```ts\nstore.count++\n```\n'
  )
  assert.equal(result.status, 1)
  assert.match(result.stdout + result.stderr, /Cannot find name 'store'/)
})

test('fails closed when no TypeScript examples are found', () => {
  const result = checkMarkdown('# No examples\n```bash\necho hello\n```\n')
  assert.equal(result.status, 1)
  assert.match(result.stdout + result.stderr, /No TypeScript examples/)
})
