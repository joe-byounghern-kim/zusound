#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const sourceRoot = resolve(root, '.agents/skills')
const bridgeRoot = resolve(root, '.claude/skills')
const generatedMarker = '<!-- GENERATED FILE: DO NOT EDIT -->'
const sourceMarkerPrefix = '<!-- Source: .agents/skills/'

if (!existsSync(sourceRoot)) {
  console.error('[skills-bridge] Missing .agents/skills. Nothing to bridge.')
  process.exit(1)
}

mkdirSync(bridgeRoot, { recursive: true })

const dirs = readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const generatedOutputs = dirs.map((dir) => {
  const skillPath = join(sourceRoot, dir, 'SKILL.md')
  const content = readFileSync(skillPath, 'utf8')
  const outName = `${dir}.md`
  const outPath = join(bridgeRoot, outName)
  const bridged = [
    generatedMarker,
    `<!-- Source: ${relative(root, skillPath)} -->`,
    '',
    content,
    '',
  ].join('\n')

  return { outName, outPath, bridged }
})

const tempRoot = mkdtempSync(join(bridgeRoot, '.skills-bridge-'))
for (const output of generatedOutputs) {
  writeFileSync(join(tempRoot, output.outName), output.bridged, 'utf8')
}

for (const output of generatedOutputs) {
  renameSync(join(tempRoot, output.outName), output.outPath)
}

rmSync(tempRoot, { recursive: true, force: true })

const expected = new Set(generatedOutputs.map((output) => output.outName))
const stale = readdirSync(bridgeRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !expected.has(entry.name))
  .map((entry) => join(bridgeRoot, entry.name))

for (const stalePath of stale) {
  const staleContent = readFileSync(stalePath, 'utf8')
  if (staleContent.startsWith(`${generatedMarker}\n${sourceMarkerPrefix}`)) {
    rmSync(stalePath)
  }
}

console.log(
  `[skills-bridge] Generated ${dirs.length} local bridge files in ${relative(root, bridgeRoot)}`
)
