#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = process.cwd()
const changesetDir = resolve(projectRoot, '.changeset')
const dryRun = process.argv.includes('--dry-run')
const packageName = process.env.RELEASE_PACKAGE_NAME || 'zusound'
const manualBump = (process.env.RELEASE_BUMP || '').trim()
const releaseRangeOverride = (process.env.RELEASE_RANGE || '').trim()
const allowedBumps = new Set(['patch', 'minor', 'major'])

function fail(message, code = 1) {
  console.error(`[auto-changeset] ${message}`)
  process.exit(code)
}

function run(command, options = {}) {
  const { allowFailure = false } = options
  try {
    return execSync(command, { cwd: projectRoot, encoding: 'utf8' }).trim()
  } catch (error) {
    if (allowFailure) {
      return ''
    }

    throw error
  }
}

function getExistingChangesetFiles() {
  return readdirSync(changesetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.md'))
    .filter((name) => name !== 'README.md')
}

function getLatestTag() {
  return run('git describe --tags --abbrev=0 --match "v*"', { allowFailure: true })
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getRelevantChangesetFiles(files, targetPackage) {
  const targetPattern = new RegExp(`['"]${escapeRegExp(targetPackage)}['"]\\s*:`)

  return files.filter((name) => {
    const fullPath = resolve(changesetDir, name)
    const content = readFileSync(fullPath, 'utf8')
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) {
      return false
    }

    return targetPattern.test(frontmatterMatch[1])
  })
}

function resolveCommitRange() {
  if (releaseRangeOverride) {
    return releaseRangeOverride
  }

  const latestTag = getLatestTag()
  if (latestTag) {
    return `${latestTag}..HEAD`
  }

  fail(
    'No release tag found. Set RELEASE_BUMP (patch/minor/major) or RELEASE_RANGE to compute an automatic bump safely.'
  )
}

function parseCommitMessages(rawLog) {
  return rawLog
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [subject = '', body = ''] = entry.split('\x1f')
      return { subject: subject.trim(), body: body.trim() }
    })
}

function detectBumpFromCommitMessages() {
  const range = resolveCommitRange()
  if (!range) {
    return 'patch'
  }

  let rawLog = ''
  try {
    rawLog = run(`git log --format=%s%x1f%b%x1e ${range}`)
  } catch {
    fail(`Unable to read commit range '${range}'. Set a valid RELEASE_RANGE or RELEASE_BUMP.`)
  }
  const commits = parseCommitMessages(rawLog)

  if (commits.length === 0) {
    return 'patch'
  }

  let detected = 'patch'
  for (const commit of commits) {
    if (/^[a-z]+(?:\([^)]+\))?!:/.test(commit.subject)) {
      return 'major'
    }

    if (/^\s*BREAKING[ -]CHANGE:\s/m.test(commit.body)) {
      return 'major'
    }

    if (/^feat(?:\([^)]+\))?:/.test(commit.subject)) {
      detected = 'minor'
    }
  }

  return detected
}

function resolveBumpType() {
  if (!manualBump) {
    return detectBumpFromCommitMessages()
  }

  return manualBump
}

function validateManualBump() {
  if (!manualBump) {
    return
  }

  if (!allowedBumps.has(manualBump)) {
    fail(`Invalid RELEASE_BUMP='${manualBump}'. Use patch, minor, or major.`)
  }
}

function formatTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '')
}

validateManualBump()

const existingChangesets = getExistingChangesetFiles()
if (existingChangesets.length > 0) {
  const relevantChangesets = getRelevantChangesetFiles(existingChangesets, packageName)
  if (relevantChangesets.length > 0) {
    console.log(
      '[auto-changeset] Existing package-targeted changeset files found. Skipping auto generation.'
    )
    for (const file of relevantChangesets) {
      console.log(`[auto-changeset] - ${file}`)
    }
    process.exit(0)
  }

  console.log('[auto-changeset] Existing unrelated changesets found. Continuing auto generation.')
  for (const file of existingChangesets) {
    console.log(`[auto-changeset] - ${file}`)
  }
}

const bumpType = resolveBumpType()
const shortSha = (process.env.GITHUB_SHA || run('git rev-parse --short HEAD')).slice(0, 7)
const changesetFileName = `auto-${formatTimestamp()}-${shortSha}.md`
const changesetPath = resolve(changesetDir, changesetFileName)
const message =
  `---\n` +
  `'${packageName}': ${bumpType}\n` +
  `---\n\n` +
  `Automated release from main merge (${shortSha}).\n`

if (dryRun) {
  console.log(
    `[auto-changeset] Dry run: would create ${changesetFileName} with bump '${bumpType}'.`
  )
  process.exit(0)
}

writeFileSync(changesetPath, message, 'utf8')
console.log(`[auto-changeset] Created ${changesetFileName} with bump '${bumpType}'.`)
