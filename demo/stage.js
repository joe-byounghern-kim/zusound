import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.resolve(__dirname, '..')
const demoDir = __dirname
const distDir = path.join(demoDir, 'dist-site')

// Source paths
const sources = {
  app: [
    { src: path.join(demoDir, 'index.html'), dest: 'index.html' },
    { src: path.join(demoDir, 'style.css'), dest: 'style.css' },
    { src: path.join(demoDir, 'app.js'), dest: 'app.js' },
  ],
  lib: path.join(rootDir, 'packages/zusound/dist'),
  zustand: path.join(rootDir, 'node_modules/zustand/esm'),
}

const missing = []
for (const file of sources.app) {
  if (!fs.existsSync(file.src)) missing.push(file.src)
}
if (!fs.existsSync(sources.lib)) missing.push(sources.lib)
if (!fs.existsSync(sources.zustand)) missing.push(sources.zustand)

if (missing.length > 0) {
  console.error('Staging prerequisites are missing:')
  for (const target of missing) {
    console.error(`- ${target}`)
  }
  console.error('Run `pnpm build` and ensure dependencies are installed, then retry.')
  process.exit(1)
}

// Clean and create dist
console.log(`Cleaning ${distDir} ...`)
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true })
}
fs.mkdirSync(distDir, { recursive: true })

// Copy app files
console.log('Copying app files...')
sources.app.forEach(({ src, dest }) => {
  fs.copyFileSync(src, path.join(distDir, dest))
})

// Copy lib
console.log('Copying zusound lib...')
const libDest = path.join(distDir, 'lib')
fs.mkdirSync(libDest, { recursive: true })
fs.cpSync(sources.lib, libDest, { recursive: true })

// Copy zustand
console.log('Copying zustand vendor...')
const zustandDest = path.join(distDir, 'vendor/zustand')
fs.mkdirSync(zustandDest, { recursive: true })
fs.cpSync(sources.zustand, zustandDest, { recursive: true })

console.log('Staging complete at demo/dist-site')
console.log('Staged entries:')
console.log('- app: index.html, style.css, app.js')
console.log('- lib: ./lib/*')
console.log('- vendor: ./vendor/zustand/*')
