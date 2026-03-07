import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const dryRun = process.argv.includes('--dry-run')

const targets = [
  'dist',
  'packages/zusound/dist',
  'packages/zusound/coverage',
  'examples/dist',
  'demo/dist-site',
  '.turbo',
  '.omx',
  '.omc',
  '.reports',
  '.save',
  '.sisyphus',
  '.claude',
  'codemaps',
  'tasks',
  'tasks.md',
]

const existingTargets = targets.filter((target) => fs.existsSync(path.join(rootDir, target)))

if (existingTargets.length === 0) {
  console.log(
    dryRun
      ? 'Dry run: no local artifacts matched the cleanup allowlist.'
      : 'No local artifacts matched the cleanup allowlist.'
  )
  process.exit(0)
}

console.log(
  `${dryRun ? 'Dry run: would remove' : 'Removing'} ${
    existingTargets.length
  } local artifact path(s):`
)

for (const target of existingTargets) {
  console.log(`- ${target}`)

  if (!dryRun) {
    fs.rmSync(path.join(rootDir, target), { recursive: true, force: true })
  }
}

if (!dryRun) {
  console.log('Local artifact cleanup complete.')
}
