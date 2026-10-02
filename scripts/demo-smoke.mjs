import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const root = resolve(import.meta.dirname, '..')
const directory = mkdtempSync(join(process.env.JCODE_SCRATCH_DIR ?? tmpdir(), 'zusound-browser-'))
let url = process.env.DEMO_URL
const chrome =
  process.env.CHROME_PATH ??
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'google-chrome')
const children = []
const events = []
const observations = []
let socket
let stderr = ''

function start(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  child.on('error', (error) => {
    stderr += `${error.message}\n`
  })
  child.stderr.on('data', (data) => {
    stderr += data.toString()
  })
  child.stdout.resume()
  children.push(child)
  return child
}
async function waitFor(check, description) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (await check()) return
    await delay(100)
  }
  throw new Error(`Timed out waiting for ${description}. ${stderr.slice(-1500)}`)
}
let nextId = 0
const pending = new Map()
function cdp(method, params = {}) {
  const id = ++nextId
  return new Promise((resolveRequest, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`CDP timeout: ${method}`))
    }, 15000)
    pending.set(id, { resolve: resolveRequest, reject, timer })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const response = await cdp('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails))
  return response.result.value
}
async function findButton(pattern) {
  return evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((button) => new RegExp(${JSON.stringify(pattern)}, 'i').test(button.textContent.trim()))
    if (!button) return null
    button.scrollIntoView({ block: 'center', behavior: 'instant' })
    const rect = button.getBoundingClientRect()
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, disabled: button.disabled }
  })()`)
}
async function click(pattern, settle = 300, beforePress = () => {}) {
  const position = await findButton(pattern)
  assert(position, `Button matching ${pattern} is present`)
  assert(!position.disabled, `Button matching ${pattern} is enabled`)
  const { x, y } = position
  beforePress()
  await cdp('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button: 'left',
    clickCount: 1,
    x,
    y,
  })
  await cdp('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button: 'left',
    clickCount: 1,
    x,
    y,
  })
  await delay(settle)
}
async function state() {
  return evaluate(
    'JSON.parse(document.querySelector("[data-testid=state], .state-display").textContent)'
  )
}
function oscillators() {
  return events.filter(
    (event) =>
      event.method === 'WebAudio.audioNodeCreated' && event.params.node.nodeType === 'Oscillator'
  ).length
}
function observe(name, result) {
  observations.push({ name, ...result })
  console.log(JSON.stringify(observations.at(-1)))
}
async function load(width, height) {
  await cdp('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  })
  await cdp('Page.navigate', { url })
  await waitFor(
    () => evaluate('Boolean(document.querySelector("[data-testid=state], .state-display"))'),
    'demo render'
  )
  await delay(500)
}
try {
  if (!process.env.DEMO_URL) {
    const reservation = createServer()
    await new Promise((resolvePort, reject) => {
      reservation.once('error', reject)
      reservation.listen(0, '127.0.0.1', resolvePort)
    })
    const previewPort = reservation.address().port
    await new Promise((resolveClose) => reservation.close(resolveClose))
    url = `http://127.0.0.1:${previewPort}/`
    const preview = start(process.execPath, [
      'demo/node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(previewPort),
      '--strictPort',
      '--outDir',
      'demo/dist',
    ])
    await waitFor(async () => {
      if (preview.exitCode !== null) throw new Error(`Production preview exited: ${stderr}`)
      try {
        return (await fetch(url)).ok
      } catch {
        return false
      }
    }, 'production preview')
  }
  start(chrome, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--remote-debugging-port=0',
    `--user-data-dir=${join(directory, 'chrome')}`,
    'about:blank',
  ])
  const portFile = join(directory, 'chrome/DevToolsActivePort')
  await waitFor(() => existsSync(portFile), 'isolated Chrome')
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
  ).json()
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolveSocket, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome socket did not open')), 15000)
    socket.onopen = () => {
      clearTimeout(timer)
      resolveSocket()
    }
    socket.onerror = (error) => {
      clearTimeout(timer)
      reject(error)
    }
  })
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (!message.id) {
      events.push(message)
      return
    }
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    clearTimeout(request.timer)
    if (message.error) request.reject(new Error(JSON.stringify(message.error)))
    else request.resolve(message.result)
  }
  await cdp('Page.enable')
  await cdp('Runtime.enable')
  await cdp('WebAudio.enable')
  await load(390, 844)
  const firstView = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((button) => /enable (audio|sound)/i.test(button.textContent))
    return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, height: innerHeight, soundActionBottom: button.getBoundingClientRect().bottom }
  })()`)
  observe('mobile-first-action', firstView)
  assert(
    firstView.soundActionBottom <= firstView.height,
    'The mobile sound/example action is in the first viewport'
  )
  assert.equal(firstView.documentWidth, firstView.width, 'Mobile page has no horizontal overflow')
  let startCount = oscillators()
  await click('enable (audio|sound)')
  assert.equal((await state()).count, 1, 'Enablement itself performs the first known update')
  assert.equal(oscillators() - startCount, 2, 'Enablement creates a real two-oscillator cue')
  observe('single-action-activation', {
    count: (await state()).count,
    oscillators: oscillators() - startCount,
  })
  await click('mute sound')
  startCount = oscillators()
  await click('^(try \\+1|increment \\(\\+\\))$')
  assert.equal((await state()).count, 2, 'State updates remain usable while muted')
  assert.equal(oscillators() - startCount, 0, 'Muted updates schedule no new audio')
  observe('mute-keeps-state-usable', {
    count: (await state()).count,
    oscillators: oscillators() - startCount,
  })
  await click('^add item$')
  const operation = await evaluate(
    'document.querySelector(".log-entry .badge")?.textContent.trim().toLowerCase()'
  )
  assert.equal(operation, 'update', 'Adding an array element is a top-level update')
  while ((await state()).items.length) await click('^remove item$')
  const beforeNoop = await evaluate('document.querySelectorAll(".log-entry").length')
  const removeDisabled = (await findButton('^remove item$')).disabled
  assert(removeDisabled, 'Removing from an empty array is disabled')
  assert.equal(await evaluate('document.querySelectorAll(".log-entry").length'), beforeNoop)
  observe('truthful-array-changes', { operation, emptyRemovalDisabled: removeDisabled })
  await click('enable sound')
  startCount = oscillators()
  const beforeBurst = (await state()).count
  await click('run 20 updates', 100)
  assert((await findButton('run 20 updates')).disabled, 'Overlapping bursts cannot start')
  await delay(1000)
  assert.equal((await state()).count - beforeBurst, 20)
  assert.equal(oscillators() - startCount, 40)
  observe('every-update-burst', { updates: 20, oscillators: oscillators() - startCount })
  await click('after a pause')
  startCount = oscillators()
  const beforeDebounce = (await state()).count
  await click('run 20 updates')
  await delay(1000)
  assert.equal((await state()).count - beforeDebounce, 20)
  assert.equal(oscillators() - startCount, 2)
  observe('debounced-burst', { updates: 20, oscillators: oscillators() - startCount })
  await click('run 20 updates', 100)
  await click('mute sound', 100, () => {
    startCount = oscillators()
  })
  const stoppedCount = (await state()).count
  await delay(700)
  assert.equal((await state()).count, stoppedCount, 'Mute stops an in-flight burst')
  assert.equal(oscillators() - startCount, 0, 'Mute cancels pending debounced playback')
  observe('mute-cancels-burst', { stoppedCount, newOscillators: oscillators() - startCount })
  await click('^reset$')
  assert.deepEqual(await state(), { count: 0, toggled: false, items: ['Item 1'] })
  await click('enable sound')
  await click('run 20 updates', 100)
  await click('^stop$', 50, () => {
    startCount = oscillators()
  })
  const stoppedExplicitly = (await state()).count
  await delay(700)
  assert.equal((await state()).count, stoppedExplicitly, 'Stop cancels future updates')
  assert.equal(oscillators() - startCount, 0, 'Stop cancels queued debounce audio')
  await click('run 20 updates', 100)
  await click('^reset$', 50, () => {
    startCount = oscillators()
  })
  await delay(700)
  assert.deepEqual(await state(), { count: 0, toggled: false, items: ['Item 1'] })
  assert.equal(oscillators() - startCount, 0, 'Reset cancels queued debounce audio')
  assert.equal(await evaluate('document.querySelectorAll(".log-entry").length'), 0)
  observe('stop-and-reset-cancel-work', { stoppedExplicitly, resetCount: 0, newOscillators: 0 })
  await evaluate('document.querySelector(".tuning").open = true')
  await click('^soft$')
  let snippet = await evaluate('document.querySelector(".code-block pre").textContent')
  assert(snippet.includes('"pleasantness": 0.9') && snippet.includes('"duration": 0.18'))
  await click('^default$')
  snippet = await evaluate('document.querySelector(".code-block pre").textContent')
  assert(!snippet.includes('"aesthetics"'), 'Default restores native per-type sound mapping')
  await click('^custom$')
  await evaluate('document.querySelectorAll(".tone-controls input")[2].focus()')
  for (const type of ['keyDown', 'keyUp']) {
    await cdp('Input.dispatchKeyEvent', {
      type,
      key: 'End',
      code: 'End',
      windowsVirtualKeyCode: 35,
    })
  }
  snippet = await evaluate('document.querySelector(".code-block pre").textContent')
  assert(
    snippet.includes('"duration": 0.3'),
    'Milliseconds convert to seconds in copied configuration'
  )
  assert(
    snippet.includes('"debounceMs": 80') &&
      snippet.includes('unsubscribe()') &&
      snippet.includes('sound.cleanup()')
  )
  await cdp('Browser.grantPermissions', {
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    origin: new URL(url).origin,
  })
  await click('^copy code$')
  assert.equal(
    await evaluate('navigator.clipboard.readText()'),
    snippet,
    'Clipboard contains the current usable example'
  )
  await cdp('Browser.setPermission', {
    permission: { name: 'clipboard-write' },
    setting: 'denied',
    origin: new URL(url).origin,
  })
  await click('^copy code$')
  assert.match(
    await evaluate('document.querySelector(".copy-status").textContent'),
    /Copy unavailable/
  )
  observe('tone-and-copy-configuration', {
    durationSeconds: 0.3,
    copiedCurrentExample: true,
    deniedClipboardFallback: true,
  })
  await cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  const reducedMotion = await evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches')
  assert(reducedMotion)
  await evaluate('document.querySelector("input[type=range]").focus()')
  await cdp('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Home',
    code: 'Home',
    windowsVirtualKeyCode: 36,
  })
  await cdp('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Home',
    code: 'Home',
    windowsVirtualKeyCode: 36,
  })
  assert.equal(await evaluate('document.querySelector("input[type=range]").value'), '0')
  observe('keyboard-volume-and-reduced-motion', { volume: 0, reducedMotion })
  for (const [width, height] of [
    [1440, 1000],
    [768, 1024],
    [320, 740],
  ]) {
    await load(width, height)
    const layout = await evaluate(
      '({ width: innerWidth, documentWidth: document.documentElement.scrollWidth })'
    )
    assert.equal(layout.documentWidth, layout.width, `No overflow at ${width}px`)
    observe('responsive-layout', layout)
    if (width >= 768) {
      const image = await cdp('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
      })
      writeFileSync(
        join(directory, `${width === 1440 ? 'desktop' : 'tablet'}.png`),
        Buffer.from(image.data, 'base64')
      )
    }
  }
  await load(390, 844)
  const screenshot = await cdp('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(directory, 'mobile.png'), Buffer.from(screenshot.data, 'base64'))
  const exceptions = events.filter((event) => event.method === 'Runtime.exceptionThrown')
  assert.deepEqual(exceptions, [], 'No runtime exceptions')
  console.log(
    `[demo-smoke] PASS (${url}). Evidence: ${directory}. Audio graph verified, not human listening.`
  )
} finally {
  writeFileSync(
    join(directory, 'observations.json'),
    JSON.stringify(
      {
        url,
        observations,
        limitation: 'Native audio graph activity does not prove audible output.',
      },
      null,
      2
    )
  )
  if (socket) socket.close()
  for (const request of pending.values()) clearTimeout(request.timer)
  for (const child of children.reverse()) {
    child.kill('SIGTERM')
    await Promise.race([new Promise((resolveExit) => child.once('exit', resolveExit)), delay(2000)])
    if (child.exitCode === null) child.kill('SIGKILL')
  }
}
