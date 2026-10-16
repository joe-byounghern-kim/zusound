#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

const root = process.cwd()
const skillsRoot = resolve(root, '.agents/skills')
const peerRange = JSON.parse(readFileSync(join(root, 'packages/zusound/package.json'), 'utf8'))
  .peerDependencies.zustand

function fail(message) {
  console.error(`[skills-check] ${message}`)
  process.exit(1)
}

function assert(condition, message) {
  if (!condition) {
    fail(message)
  }
}

function normalize(text) {
  const noBom = text.startsWith('\uFEFF') ? text.slice(1) : text
  return noBom.replace(/\r\n/g, '\n')
}

function parseFrontmatter(markdown, filePath) {
  const source = normalize(markdown)
  if (!source.startsWith('---\n')) {
    fail(`${filePath}: missing YAML frontmatter start`)
  }

  const end = source.indexOf('\n---\n', 4)
  if (end === -1) {
    fail(`${filePath}: missing YAML frontmatter end`)
  }

  const raw = source.slice(4, end)
  const data = {}
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    const sep = line.indexOf(':')
    if (sep <= 0) {
      fail(`${filePath}: invalid frontmatter line '${line}'`)
    }
    const key = line.slice(0, sep).trim()
    const value = line.slice(sep + 1).trim()
    if (Object.hasOwn(data, key)) {
      fail(`${filePath}: duplicate frontmatter key '${key}'`)
    }
    data[key] = value
  }

  return data
}

function validateFrontmatterShape(frontmatter, filePath) {
  const allowed = new Set(['name', 'description', 'license', 'compatibility'])

  for (const key of Object.keys(frontmatter)) {
    assert(allowed.has(key), `${filePath}: unknown frontmatter key '${key}'`)
  }

  if (frontmatter.compatibility !== undefined) {
    assert(
      frontmatter.compatibility.length > 0 && frontmatter.compatibility.length <= 500,
      `${filePath}: frontmatter compatibility must be 1-500 chars when present`
    )
  }
}

function assertInside(path, base, filePath) {
  assert(
    path === base || path.startsWith(`${base}${sep}`),
    `${filePath}: link escapes skill directory '${path}'`
  )
}

function validateLinks(markdown, filePath, skillDir) {
  const source = normalize(markdown)
  const links = [
    ...source.matchAll(/\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+['"][^\n]*?['"])?\s*\)/g),
    ...source.matchAll(/^ {0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm),
  ].map((match) => match[1].replace(/^<|>$/g, ''))
  for (const link of links) {
    let href
    try {
      href = decodeURIComponent(link)
    } catch {
      fail(`${filePath}: invalid link encoding '${link}'`)
    }
    if (
      !href ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('#')
    ) {
      continue
    }

    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
      fail(`${filePath}: unsupported link scheme '${href}'`)
    }

    if (href.startsWith('/') || href.includes('\\')) {
      fail(`${filePath}: absolute filesystem link is not allowed '${href}'`)
    }

    const noAnchor = href.split(/[?#]/)[0]
    if (!noAnchor) {
      continue
    }

    const resolved = resolve(dirname(resolve(root, filePath)), noAnchor)
    assertInside(resolved, skillDir, filePath)
    assert(existsSync(resolved), `${filePath}: broken local link '${href}'`)
    assertInside(realpathSync(resolved), realpathSync(skillDir), filePath)
  }
}

function validateContent(filePath, skillDir) {
  assertInside(realpathSync(filePath), realpathSync(skillDir), relative(root, filePath))
  const content = readFileSync(filePath, 'utf8')
  validateLinks(content, relative(root, filePath), skillDir)
  if (/duration/i.test(content)) {
    const prose = content.replaceAll('`', '').replaceAll('**', '').replace(/\s+/g, ' ')
    assert(
      prose.includes('AestheticParams.duration is seconds') &&
        prose.includes('soundMapping[path].duration is milliseconds'),
      `${relative(root, filePath)}: duration units must state AestheticParams.duration is seconds and soundMapping[path].duration is milliseconds`
    )
  }
}

function referenceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink())
      fail(
        `${relative(root, path)}: link escapes skill directory or is an unsupported reference symlink`
      )
    return entry.isDirectory() ? referenceFiles(path) : entry.name.endsWith('.md') ? [path] : []
  })
}

assert(existsSync(skillsRoot), `missing canonical skills directory: ${relative(root, skillsRoot)}`)

const skillDirs = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

assert(skillDirs.length > 0, 'no skill directories found under .agents/skills')

for (const dir of skillDirs) {
  const base = join(skillsRoot, dir)
  const skillFile = join(base, 'SKILL.md')
  const refsDir = join(base, 'references')

  assert(existsSync(skillFile), `${relative(root, base)}: missing SKILL.md`)
  assert(existsSync(refsDir), `${relative(root, base)}: missing references/ directory`)
  assert(statSync(refsDir).isDirectory(), `${relative(root, refsDir)} is not a directory`)

  const refs = referenceFiles(refsDir).sort()

  assert(refs.length > 0, `${relative(root, refsDir)}: expected at least one .md reference file`)
  const compatibilityFile = join(refsDir, 'compatibility.md')
  assert(existsSync(compatibilityFile), `${relative(root, refsDir)}: missing compatibility.md`)
  assert(
    readFileSync(compatibilityFile, 'utf8').includes(`\`${peerRange}\``),
    `${relative(root, compatibilityFile)}: must state package Zustand peer range \`${peerRange}\``
  )

  const body = readFileSync(skillFile, 'utf8')
  const frontmatter = parseFrontmatter(body, relative(root, skillFile))
  validateFrontmatterShape(frontmatter, relative(root, skillFile))

  for (const key of ['name', 'description']) {
    assert(
      frontmatter[key] && frontmatter[key].length > 0,
      `${relative(root, skillFile)}: missing frontmatter key '${key}'`
    )
  }

  assert(
    frontmatter.name.length <= 64,
    `${relative(root, skillFile)}: frontmatter name exceeds 64 chars`
  )
  assert(
    frontmatter.description.length <= 1024,
    `${relative(root, skillFile)}: frontmatter description exceeds 1024 chars`
  )
  assert(
    /^[a-z0-9-]+$/.test(frontmatter.name),
    `${relative(root, skillFile)}: frontmatter name must be kebab-case`
  )
  assert(
    !frontmatter.name.startsWith('-') && !frontmatter.name.endsWith('-'),
    `${relative(root, skillFile)}: frontmatter name cannot start or end with '-'`
  )
  assert(
    !frontmatter.name.includes('--'),
    `${relative(root, skillFile)}: frontmatter name cannot contain consecutive hyphens`
  )

  if (dir !== '_template') {
    assert(
      frontmatter.name === dir,
      `${relative(root, skillFile)}: frontmatter name '${frontmatter.name}' must match directory '${dir}'`
    )
  }

  validateContent(skillFile, base)
  for (const ref of refs) {
    validateContent(ref, base)
  }
}

console.log(`[skills-check] OK (${skillDirs.length} skills validated)`)
