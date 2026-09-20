#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const version = process.argv[2]
if (!['4.0.0', '4.5.7', '5.0.14'].includes(version) || process.argv.length !== 3) {
  console.error('Usage: node scripts/check-consumer.mjs <4.0.0|4.5.7|5.0.14>')
  process.exit(1)
}

const directory = mkdtempSync(join(process.env.JCODE_SCRATCH_DIR ?? tmpdir(), 'zusound-consumer-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

try {
  const packed = JSON.parse(
    execFileSync(npm, ['pack', '--json', '--pack-destination', directory], {
      cwd: join(root, 'packages/zusound'),
      encoding: 'utf8',
    })
  )
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ name: 'zusound-consumer-check', private: true, type: 'module' })
  )
  execFileSync(
    npm,
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      join(directory, packed[0].filename),
      `zustand@${version}`,
      'typescript@5.9.3',
      'react@19.3.0',
      '@types/react@19.3.0',
      '@types/node@24.13.6',
    ],
    { cwd: directory, stdio: 'inherit' }
  )
  cpSync(join(root, 'examples/consumer'), directory, { recursive: true })
  if (version === '4.0.0') {
    // Zustand 4.0 has a default vanilla factory and stricter input-mutator metadata.
    writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2020', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true,
        noEmit: true, skipLibCheck: false,
      },
      include: ['smoke-v4.cts'],
    }))
    execFileSync(process.execPath, ['node_modules/typescript/lib/tsc.js', '-p', 'tsconfig.json'], {
      cwd: directory, stdio: 'inherit',
    })
    writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2020', module: 'ESNext', moduleResolution: 'Bundler', strict: true,
        noEmit: true, skipLibCheck: false,
      },
      include: ['smoke-v4.ts'],
    }))
  } else {
    const smokeSource = readFileSync(join(directory, 'smoke.ts'), 'utf8').replace(
      '// __ZUSOUND_CREATE_STORE_IMPORT__',
      "import { createStore } from 'zustand/vanilla'"
    )
    writeFileSync(join(directory, 'smoke.ts'), smokeSource)
    // Compile the same contract through both import and require type exports.
    writeFileSync(join(directory, 'smoke.cts'), smokeSource)
  }
  for (const file of ['smoke.mjs', 'smoke.cjs']) {
    execFileSync(process.execPath, [file], { cwd: directory, stdio: 'inherit' })
  }
  execFileSync(process.execPath, ['node_modules/typescript/lib/tsc.js', '-p', 'tsconfig.json'], {
    cwd: directory,
    stdio: 'inherit',
  })
  console.log(`[consumer-check] OK (Zustand ${version}: ESM, CommonJS, strict TypeScript)`)
} catch (error) {
  console.error(`[consumer-check] Failed for Zustand ${version}: ${error.message}`)
  process.exitCode = 1
} finally {
  rmSync(directory, { recursive: true, force: true })
}
