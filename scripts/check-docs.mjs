#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, relative, resolve, sep } from 'node:path'

const root = process.cwd()
const documents = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  {
    cwd: root,
    encoding: 'utf8',
  }
)
  .split('\0')
  .filter(Boolean)
  .filter((file) => ['.md', '.mdx'].includes(extname(file).toLowerCase()))
  .filter((file) => existsSync(resolve(root, file)))

const markdownLinks = /!?\[[^\]]*\]\(([^)]+)\)/g
const referenceLinks = /^\[[^\]]+\]:\s*(\S+)/gm
const htmlLinks = /(?:href|src)=["']([^"']+)["']/g
const failures = []

function stripCode(content) {
  const visible = []
  let fence = null

  for (const line of content.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
    if (marker) {
      if (!fence) {
        fence = marker
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null
      }
      visible.push('')
      continue
    }

    visible.push(fence ? '' : line.replace(/`[^`\n]*`/g, ''))
  }

  return visible.join('\n')
}

function normalizeTarget(raw) {
  const trimmed = raw.trim()
  const angleMatch = trimmed.match(/^<([^>]+)>/)
  const target = angleMatch?.[1] ?? trimmed.split(/\s+(?=["'])/)[0]
  return target.split('#', 1)[0].split('?', 1)[0]
}

function checkTarget(file, raw) {
  const target = normalizeTarget(raw)
  if (!target || target.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(target)) {
    return
  }

  let decoded
  try {
    decoded = decodeURIComponent(target)
  } catch {
    failures.push(`${file}: invalid encoded link '${raw}'`)
    return
  }

  const absolute = decoded.startsWith('/')
    ? resolve(root, decoded.slice(1))
    : resolve(root, dirname(file), decoded)
  const repositoryPath = relative(root, absolute)
  if (repositoryPath === '..' || repositoryPath.startsWith(`..${sep}`)) {
    failures.push(`${file}: local reference escapes repository '${raw}'`)
    return
  }

  if (!existsSync(absolute)) {
    failures.push(`${file}: broken local reference '${raw}'`)
  }
}

for (const file of documents) {
  const content = stripCode(readFileSync(resolve(root, file), 'utf8'))
  for (const match of content.matchAll(markdownLinks)) checkTarget(file, match[1])
  for (const match of content.matchAll(referenceLinks)) checkTarget(file, match[1])
  for (const match of content.matchAll(htmlLinks)) checkTarget(file, match[1])
}

if (failures.length > 0) {
  for (const failure of failures.sort()) console.error(`[docs-check] ${failure}`)
  process.exit(1)
}

console.log(`[docs-check] OK (${documents.length} documentation files checked)`)
