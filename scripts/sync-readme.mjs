#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SECTION_IDS = [
  'install',
  'quick-start',
  'create-zusound',
  'zusound-options',
  'aesthetic-parameters',
  'advanced-example',
  'production-notes',
  'what-youll-hear',
]

const REQUIRED_IDS = new Set(SECTION_IDS)
const START_PREFIX = '<!-- README_SYNC:SECTION_START:'
const END_PREFIX = '<!-- README_SYNC:SECTION_END:'

const sourcePath = resolve(process.cwd(), 'packages/zusound/README.md')
const targetPath = resolve(process.cwd(), 'README.md')
const checkMode = process.argv.includes('--check')

function fail(message, code = 2) {
  console.error(`[readme-sync] ${message}`)
  process.exit(code)
}

function normalize(text) {
  const lf = text.replace(/\r\n/g, '\n')
  return lf.endsWith('\n') ? lf : `${lf}\n`
}

function parseMarkerId(line, prefix) {
  if (!line.startsWith(prefix) || !line.endsWith(' -->')) {
    return null
  }

  return line.slice(prefix.length, -4)
}

function parseSections(content, label) {
  const lines = normalize(content).split('\n')
  const sections = new Map()

  let i = 0
  while (i < lines.length) {
    const startId = parseMarkerId(lines[i], START_PREFIX)
    if (!startId) {
      i += 1
      continue
    }

    if (!REQUIRED_IDS.has(startId)) {
      fail(`${label}: unknown section id '${startId}'`)
    }

    if (sections.has(startId)) {
      fail(`${label}: duplicate section id '${startId}'`)
    }

    let endIdx = -1
    for (let j = i + 1; j < lines.length; j += 1) {
      const nestedStart = parseMarkerId(lines[j], START_PREFIX)
      if (nestedStart) {
        fail(`${label}: nested start marker '${nestedStart}' before end of '${startId}'`)
      }

      const endId = parseMarkerId(lines[j], END_PREFIX)
      if (!endId) {
        continue
      }

      if (endId !== startId) {
        fail(`${label}: end marker '${endId}' does not match start '${startId}'`)
      }

      endIdx = j
      break
    }

    if (endIdx === -1) {
      fail(`${label}: missing end marker for '${startId}'`)
    }

    sections.set(startId, {
      startIdx: i,
      endIdx,
      innerLines: lines.slice(i + 1, endIdx),
    })

    i = endIdx + 1
  }

  for (const id of SECTION_IDS) {
    if (!sections.has(id)) {
      fail(`${label}: missing required section '${id}'`)
    }
  }

  return { lines, sections }
}

function syncReadme(sourceContent, targetContent) {
  const source = parseSections(sourceContent, 'packages/zusound/README.md')
  const target = parseSections(targetContent, 'README.md')

  const targetLines = [...target.lines]

  const sectionsInTargetOrder = [...target.sections.entries()]
    .map(([id, section]) => ({ id, section }))
    .sort((a, b) => b.section.startIdx - a.section.startIdx)

  for (const { id, section } of sectionsInTargetOrder) {
    const sourceSection = source.sections.get(id)
    if (!sourceSection) {
      fail(`packages/zusound/README.md: missing section '${id}'`)
    }

    targetLines.splice(
      section.startIdx + 1,
      section.endIdx - section.startIdx - 1,
      ...sourceSection.innerLines
    )
  }

  return normalize(targetLines.join('\n'))
}

const sourceContent = readFileSync(sourcePath, 'utf8')
const currentTargetContent = readFileSync(targetPath, 'utf8')
const nextTargetContent = syncReadme(sourceContent, currentTargetContent)

if (checkMode) {
  if (normalize(currentTargetContent) !== nextTargetContent) {
    console.error('[readme-sync] README drift detected. Run: pnpm readme:sync')
    process.exit(1)
  }

  console.log('[readme-sync] README sync check passed.')
  process.exit(0)
}

if (normalize(currentTargetContent) === nextTargetContent) {
  console.log('[readme-sync] README already synchronized.')
  process.exit(0)
}

writeFileSync(targetPath, nextTargetContent, 'utf8')
console.log('[readme-sync] Synchronized README.md from packages/zusound/README.md.')
