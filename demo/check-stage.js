import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, 'dist-site')

const checks = ['index.html', 'style.css', 'app.js', 'lib/index.js', 'vendor/zustand/vanilla.mjs']

const requiredDirs = ['lib', 'vendor/zustand']

console.log('Running smoke checks on demo/dist-site...')

if (!fs.existsSync(distDir)) {
  console.error(`FAIL: dist-site directory not found at ${distDir}`)
  process.exit(1)
}

let errors = 0
checks.forEach((file) => {
  const filePath = path.join(distDir, file)
  if (!fs.existsSync(filePath)) {
    console.error(`MISSING: ${file}`)
    errors++
  } else {
    console.log(`OK: ${file}`)
  }
})

requiredDirs.forEach((dir) => {
  const dirPath = path.join(distDir, dir)
  if (!fs.existsSync(dirPath)) {
    console.error(`MISSING DIR: ${dir}`)
    errors++
  } else if (!fs.statSync(dirPath).isDirectory()) {
    console.error(`NOT A DIR: ${dir}`)
    errors++
  } else {
    console.log(`OK DIR: ${dir}`)
  }
})

// Check index.html for relative paths
const indexPath = path.join(distDir, 'index.html')
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf-8')
  if (indexHtml.includes('"/vendor/') || indexHtml.includes('"/lib/')) {
    console.error('FAIL: index.html contains absolute paths (must be relative for GH Pages)')
    errors++
  } else {
    console.log('OK: index.html paths are relative')
  }

  if (!indexHtml.includes('"zustand/vanilla": "./vendor/zustand/vanilla.mjs"')) {
    console.error('FAIL: index.html is missing expected relative import map for zustand')
    errors++
  } else {
    console.log('OK: index.html import map points to ./vendor/zustand/vanilla.mjs')
  }

  if (!indexHtml.includes('"zusound": "./lib/index.js"')) {
    console.error('FAIL: index.html is missing expected relative import map for zusound')
    errors++
  } else {
    console.log('OK: index.html import map points to ./lib/index.js')
  }
}

if (errors > 0) {
  console.error(`Smoke checks failed with ${errors} errors.`)
  process.exit(1)
} else {
  console.log('Smoke checks passed.')
}
