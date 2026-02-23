import http from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const port = Number(process.env.PORT ?? 3000)

const demoDir = __dirname
const zusoundDistDir = join(rootDir, 'packages/zusound/dist')
const zustandEsmDir = join(rootDir, 'node_modules/zustand/esm')

function contentTypeForPath(pathname) {
  const ext = extname(pathname).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.js' || ext === '.mjs') return 'text/javascript; charset=utf-8'
  if (ext === '.json') return 'application/json; charset=utf-8'
  if (ext === '.map') return 'application/json; charset=utf-8'
  if (ext === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

function safeResolve(baseDir, requestPath) {
  const normalized = requestPath.replace(/\\/g, '/').replace(/^\/+/, '')
  const resolved = resolve(baseDir, normalized)
  if (!resolved.startsWith(resolve(baseDir))) return null
  return resolved
}

function send404(res) {
  res.statusCode = 404
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end('Not found')
}

function sendFile(res, filePath, pathname) {
  if (!existsSync(filePath)) return send404(res)
  const stat = statSync(filePath)
  if (!stat.isFile()) return send404(res)

  res.statusCode = 200
  res.setHeader('Content-Type', contentTypeForPath(pathname))
  res.setHeader('Cache-Control', 'no-cache')

  const stream = createReadStream(filePath)
  stream.on('error', () => {
    res.statusCode = 500
    res.end('Internal server error')
  })
  stream.pipe(res)
}

function handleSse(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.write('\n')

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  const events = ['user_joined', 'message_received', 'notification', 'system_alert']
  const interval = setInterval(() => {
    const randomEvent = events[Math.floor(Math.random() * events.length)]
    sendEvent({ type: randomEvent, timestamp: Date.now() })
  }, 5000)

  req.on('close', () => {
    clearInterval(interval)
  })
}

const server = http.createServer((req, res) => {
  if (!req.url) return send404(res)

  const url = new URL(req.url, `http://${req.headers.host ?? `localhost:${port}`}`)
  const pathname = url.pathname

  if (pathname === '/events') return handleSse(req, res)

  if (pathname.startsWith('/lib/')) {
    const filePath = safeResolve(zusoundDistDir, pathname.slice('/lib/'.length))
    if (!filePath) return send404(res)
    return sendFile(res, filePath, pathname)
  }

  if (pathname.startsWith('/vendor/zustand/')) {
    const filePath = safeResolve(zustandEsmDir, pathname.slice('/vendor/zustand/'.length))
    if (!filePath) return send404(res)
    return sendFile(res, filePath, pathname)
  }

  const targetPath = pathname === '/' ? '/index.html' : pathname
  const filePath = safeResolve(demoDir, targetPath)
  if (!filePath) return send404(res)
  return sendFile(res, filePath, targetPath)
})

server.listen(port, () => {
  console.log(`Demo server running at http://localhost:${port}`)
  console.log(`- Zusound mapped from: ${zusoundDistDir}`)
  console.log(`- Zustand mapped from: ${zustandEsmDir}`)
})
