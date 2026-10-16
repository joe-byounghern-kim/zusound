#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  lstatSync,
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

function isGenerated(path) {
  return (
    existsSync(path) &&
    lstatSync(path).isFile() &&
    readFileSync(path, 'utf8').includes(`${generatedMarker}\n${sourceMarkerPrefix}`)
  )
}

function bridgeContent(content, sourcePath) {
  // Keep YAML first so Claude Code can discover the name and description.
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const end = normalized.startsWith('---\n') ? normalized.indexOf('\n---\n', 4) : -1
  if (end === -1) throw new Error(`${sourcePath}: missing YAML frontmatter`)
  const offset = end + '\n---\n'.length
  return `${normalized.slice(0, offset)}\n${generatedMarker}\n<!-- Source: ${relative(root, sourcePath)} -->\n${normalized.slice(offset)}`
}

let tempRoot
try {
  if (!existsSync(sourceRoot)) throw new Error('Missing .agents/skills. Nothing to bridge.')
  const dirs = readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  if (!dirs.length) throw new Error('No skills found in .agents/skills.')

  // Preflight every source and destination before replacing generated output.
  const outputs = dirs.map((dir) => {
    const skillPath = join(sourceRoot, dir, 'SKILL.md')
    const references = join(sourceRoot, dir, 'references')
    const content = bridgeContent(readFileSync(skillPath, 'utf8'), skillPath)
    if (!existsSync(references) || !lstatSync(references).isDirectory()) {
      throw new Error(`${references}: missing references directory`)
    }
    const destination = join(bridgeRoot, dir)
    if (
      existsSync(destination) &&
      (!lstatSync(destination).isDirectory() || !isGenerated(join(destination, 'SKILL.md')))
    ) {
      throw new Error(`${destination}: not generated, refusing to overwrite hand-authored output`)
    }
    return { dir, references, content, destination }
  })

  mkdirSync(bridgeRoot, { recursive: true })
  tempRoot = mkdtempSync(join(bridgeRoot, '.skills-bridge-'))
  for (const output of outputs) {
    const staged = join(tempRoot, output.dir)
    mkdirSync(staged)
    writeFileSync(join(staged, 'SKILL.md'), output.content, 'utf8')
    cpSync(output.references, join(staged, 'references'), { recursive: true })
  }
  for (const output of outputs) {
    rmSync(output.destination, { recursive: true, force: true })
    renameSync(join(tempRoot, output.dir), output.destination)
  }

  const expected = new Set(dirs)
  for (const entry of readdirSync(bridgeRoot, { withFileTypes: true })) {
    const path = join(bridgeRoot, entry.name)
    if (entry.isFile() && entry.name.endsWith('.md') && isGenerated(path)) {
      // Includes legacy flat files for skills that are still current.
      rmSync(path)
    } else if (
      entry.isDirectory() &&
      !expected.has(entry.name) &&
      isGenerated(join(path, 'SKILL.md'))
    ) {
      rmSync(path, { recursive: true })
    }
  }
  console.log(
    `[skills-bridge] Generated ${dirs.length} local skill directories in ${relative(root, bridgeRoot)}`
  )
} catch (error) {
  console.error(`[skills-bridge] ${error.message}`)
  process.exitCode = 1
} finally {
  if (tempRoot) rmSync(tempRoot, { recursive: true, force: true })
}
