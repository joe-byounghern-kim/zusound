import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, 'dist-site')

if (!fs.existsSync(distDir)) {
  console.log('Nothing to clean: demo/dist-site does not exist.')
  process.exit(0)
}

fs.rmSync(distDir, { recursive: true, force: true })
console.log('Removed demo/dist-site')
