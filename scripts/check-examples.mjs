#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
if (args.length && (args.length !== 2 || args[0] !== '--file')) {
  console.error('Usage: node scripts/check-examples.mjs [--file markdown-path]')
  process.exit(1)
}

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : []
  })
}

const documents = args.length
  ? [resolve(args[1])]
  : [
      join(root, 'README.md'),
      join(root, 'packages/zusound/README.md'),
      ...markdownFiles(join(root, '.agents')),
    ]
const directory = mkdtempSync(join(process.env.JCODE_SCRATCH_DIR ?? tmpdir(), 'zusound-examples-'))

try {
  // Resolve actual installed React/Zustand declarations and the built workspace package.
  symlinkSync(join(root, 'demo/node_modules'), join(directory, 'node_modules'), 'junction')
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module' }))
  let count = 0
  const sources = new Map()
  for (const document of documents) {
    const markdown = readFileSync(document, 'utf8')
    let ordinal = 0
    for (const match of markdown.matchAll(/^```(typescript|ts|tsx)\s*\n([\s\S]*?)^```\s*$/gm)) {
      ordinal++
      count++
      const filename = `example-${count}.${match[1] === 'tsx' ? 'tsx' : 'ts'}`
      sources.set(filename, `${relative(root, document)}: example ${ordinal}`)
      // Force module scope so independent copy-paste examples cannot share declarations.
      writeFileSync(join(directory, filename), `${match[2]}\nexport {}\n`)
    }
  }
  if (!count) throw new Error('No TypeScript examples found')
  writeFileSync(
    join(directory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        jsx: 'react-jsx',
        types: ['node', 'react'],
      },
      include: ['*.ts', '*.tsx'],
    })
  )
  const result = spawnSync(
    process.execPath,
    [
      join(root, 'node_modules/typescript/lib/tsc.js'),
      '-p',
      join(directory, 'tsconfig.json'),
      '--pretty',
      'false',
    ],
    { encoding: 'utf8', cwd: directory }
  )
  if (result.error) throw result.error
  if (result.status !== 0) {
    let output = result.stdout + result.stderr
    for (const [filename, source] of sources) output = output.replaceAll(filename, source)
    console.error(output || `TypeScript exited with ${result.status}`)
    process.exitCode = 1
  } else {
    console.log(`[examples-check] OK (${count} examples from ${documents.length} documents)`)
  }
} catch (error) {
  console.error(`[examples-check] ${error.message}`)
  process.exitCode = 1
} finally {
  rmSync(directory, { recursive: true, force: true })
}
