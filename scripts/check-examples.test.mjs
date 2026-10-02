import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
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

test('rejects an unclosed TypeScript fence even after a valid example', () => {
  const result = checkMarkdown('```ts\nconst count = 1\n```\n\n```ts\nconst bad: number = "bad"\n')
  assert.equal(result.status, 1)
  assert.match(result.stdout + result.stderr, /Unclosed TypeScript fence/)
})

test('compiles tilde fences and fences with a title', () => {
  const result = checkMarkdown('~~~ts title="counter.ts"\nconst count: number = 1\n~~~\n')
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /1 examples/)
})

function checkDefaultDocuments(apiMarkdown) {
  const directory = mkdtempSync(join(scratch, 'zusound-reference-test-'))
  try {
    for (const path of ['scripts', 'packages/zusound', 'docs', '.agents/skills', 'demo']) {
      mkdirSync(join(directory, path), { recursive: true })
    }
    copyFileSync('scripts/check-examples.mjs', join(directory, 'scripts/check-examples.mjs'))
    symlinkSync(resolve('node_modules'), join(directory, 'node_modules'), 'junction')
    symlinkSync(resolve('demo/node_modules'), join(directory, 'demo/node_modules'), 'junction')
    const valid = '```ts\nconst count: number = 1\n```\n'
    writeFileSync(join(directory, 'README.md'), valid)
    writeFileSync(join(directory, 'packages/zusound/README.md'), valid)
    writeFileSync(join(directory, '.agents/skills/example.md'), valid)
    writeFileSync(join(directory, 'docs/API.md'), apiMarkdown)
    return spawnSync(process.execPath, [join(directory, 'scripts/check-examples.mjs')], {
      encoding: 'utf8',
    })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('default discovery compiles the consolidated API reference alongside READMEs and skills', () => {
  const result = checkDefaultDocuments('```ts\nconst duration: number = 150\n```\n')
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /4 examples from 4 documents/)
})

test('default discovery rejects API reference type errors and identifies their source', () => {
  const result = checkDefaultDocuments('```ts\nconst duration: number = "bad"\n```\n')
  assert.equal(result.status, 1)
  assert.match(result.stdout + result.stderr, /docs\/API\.md: example 1/)
  assert.match(result.stdout + result.stderr, /TS2322/)
})
