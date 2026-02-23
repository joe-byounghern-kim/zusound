import { createStore } from 'zustand/vanilla'
import { zusound, createZusound } from 'zusound'

const initialDataState = {
  count: 0,
  toggled: false,
  status: 'idle',
  items: ['apple', 'banana'],
  lastEvent: null,
  user: { name: 'Guest', active: true },
}

const els = {
  unlockAudio: document.getElementById('unlock-audio'),
  audioStatus: document.getElementById('audio-status'),
  prevScene: document.getElementById('prev-scene'),
  nextScene: document.getElementById('next-scene'),
  sceneChips: Array.from(document.querySelectorAll('.chip')),
  sceneIndicator: document.getElementById('scene-indicator'),
  eventMode: document.getElementById('event-source-mode'),
  sceneHint: document.getElementById('scene-hint'),
  initModeSelect: document.getElementById('init-mode-select'),
  hearingNote: document.getElementById('hearing-note'),
  signalCanvas: document.getElementById('signal-canvas'),
  signalCaption: document.getElementById('signal-caption'),
  display: document.getElementById('state-display'),
  log: document.getElementById('log-container'),
  toggleSound: document.getElementById('sound-toggle'),
  btnInc: document.getElementById('btn-inc'),
  btnDec: document.getElementById('btn-dec'),
  btnToggle: document.getElementById('btn-toggle'),
  btnAdd: document.getElementById('btn-add-item'),
  btnRemove: document.getElementById('btn-remove-item'),
  btnString: document.getElementById('btn-string'),
  btnReset: document.getElementById('btn-reset'),
  btnDangerBurst: document.getElementById('btn-danger-burst'),
  btnStress: document.getElementById('btn-stress-test'),
  btnApi: document.getElementById('btn-simulate-api'),
  volume: document.getElementById('volume'),
  volumeOut: document.getElementById('volume-out'),
  debounce: document.getElementById('debounce'),
  debounceOut: document.getElementById('debounce-out'),
  pleasantness: document.getElementById('pleasantness'),
  pleasantnessOut: document.getElementById('pleasantness-out'),
  brightness: document.getElementById('brightness'),
  brightnessOut: document.getElementById('brightness-out'),
  arousal: document.getElementById('arousal'),
  arousalOut: document.getElementById('arousal-out'),
  valence: document.getElementById('valence'),
  valenceOut: document.getElementById('valence-out'),
  simultaneity: document.getElementById('simultaneity'),
  simultaneityOut: document.getElementById('simultaneity-out'),
  presetCalm: document.getElementById('preset-calm'),
  presetBalanced: document.getElementById('preset-balanced'),
  presetTense: document.getElementById('preset-tense'),
  presetChaotic: document.getElementById('preset-chaotic'),
}

const scenes = [
  {
    id: 1,
    title: 'State Triggers',
    hint: 'Run basic state actions and listen for distinct operation cues.',
  },
  {
    id: 2,
    title: 'Aesthetic Mapping',
    hint: 'Use presets and sliders to shape timbre, interval tension, and timing feel.',
  },
  {
    id: 3,
    title: 'Timing and Throughput',
    hint: 'Use stress and API simulation to test rapid update behavior.',
  },
]

const hearingNotesByType = {
  add: 'Adds should feel brighter and more consonant than removals.',
  remove: 'Removals should feel darker or tenser than adds.',
  update: 'Updates should feel stable unless aesthetics are pushed toward extremes.',
}

let currentSceneIndex = 0
let sceneStarts = false

const signalState = {
  level: 0,
  bars: Array.from({ length: 36 }, () => 0),
  rafId: 0,
  ctx: null,
  reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
}

function updateAudioStatus(ready) {
  if (!els.audioStatus) return
  els.audioStatus.textContent = ready ? 'Audio is ready' : 'Audio is locked'
  els.audioStatus.classList.toggle('is-ready', ready)
}

function updateEventMode(label, modeClass) {
  if (!els.eventMode) return
  els.eventMode.textContent = `Mode: ${label}`
  els.eventMode.classList.remove('is-local', 'is-hosted')
  if (modeClass) {
    els.eventMode.classList.add(modeClass)
  }
}

function markSignal(type) {
  const energyByType = {
    add: 1,
    update: 0.8,
    remove: 0.92,
  }
  const energy = energyByType[type] ?? 0.75
  signalState.level = Math.min(1, signalState.level * 0.6 + energy * 0.8)
  signalState.bars.push(signalState.level)
  signalState.bars.shift()

  if (els.signalCaption) {
    if (type === 'add')
      els.signalCaption.textContent = 'Signal pulse: additive updates are landing.'
    if (type === 'remove')
      els.signalCaption.textContent = 'Signal pulse: removals are introducing tension.'
    if (type === 'update')
      els.signalCaption.textContent = 'Signal pulse: neutral updates are flowing.'
  }

  if (signalState.reduceMotion.matches) {
    drawSignalFrame()
  }
}

function resizeSignalCanvas() {
  if (!els.signalCanvas || !signalState.ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = els.signalCanvas.clientWidth
  const height = els.signalCanvas.clientHeight
  els.signalCanvas.width = Math.floor(width * dpr)
  els.signalCanvas.height = Math.floor(height * dpr)
  signalState.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function drawSignalFrame() {
  if (!els.signalCanvas || !signalState.ctx) return
  const width = els.signalCanvas.clientWidth
  const height = els.signalCanvas.clientHeight

  signalState.ctx.fillStyle = '#080b18'
  signalState.ctx.fillRect(0, 0, width, height)

  const bars = signalState.bars
  const gap = 3
  const barWidth = Math.max(3, (width - gap * bars.length) / bars.length)

  bars.forEach((value, index) => {
    const x = index * (barWidth + gap)
    const normalized = Math.max(0.06, Math.min(1, value))
    const barHeight = normalized * (height - 20)
    const y = height - barHeight - 6

    const hue = 190 + Math.round(normalized * 110)
    signalState.ctx.fillStyle = `hsla(${hue}, 86%, 70%, 0.88)`
    signalState.ctx.fillRect(x, y, barWidth, barHeight)
  })

  signalState.level *= 0.95
  if (signalState.level < 0.03) {
    signalState.level = 0
  }
}

function signalLoop() {
  if (document.hidden || signalState.reduceMotion.matches) {
    signalState.rafId = 0
    return
  }
  drawSignalFrame()
  signalState.rafId = requestAnimationFrame(signalLoop)
}

function ensureSignalLoop() {
  if (!signalState.rafId) {
    signalState.rafId = requestAnimationFrame(signalLoop)
  }
}

function initSignalCanvas() {
  if (!els.signalCanvas) return
  signalState.ctx = els.signalCanvas.getContext('2d')
  if (!signalState.ctx) return
  resizeSignalCanvas()
  drawSignalFrame()
  ensureSignalLoop()
  window.addEventListener('resize', resizeSignalCanvas)
  document.addEventListener('visibilitychange', ensureSignalLoop)
  signalState.reduceMotion.addEventListener('change', ensureSignalLoop)
}

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function logAction(action, type = 'update') {
  const entry = document.createElement('div')
  entry.className = 'log-entry'
  entry.innerHTML = `<span class="timestamp">${formatTime(new Date())}</span><span class="badge ${type}">${type}</span><span>${action}</span>`
  els.log.prepend(entry)
  if (els.hearingNote && hearingNotesByType[type]) {
    els.hearingNote.textContent = hearingNotesByType[type]
  }
  markSignal(type)
  if (els.log.children.length > 30) {
    els.log.lastElementChild?.remove()
  }
}

function applyExternalEvent(data, sourceLabel) {
  store.getState().setLastEvent(data)
  logAction(`${sourceLabel}: ${data.type}`, 'update')
}

function render(state) {
  els.display.textContent = JSON.stringify(state, null, 2)
}

function readNumber(input) {
  return Number(input.value)
}

function readBool(input) {
  return Boolean(input.checked)
}

function syncOutputs() {
  const volume = readNumber(els.volume)
  const debounceMs = readNumber(els.debounce)
  const pleasantness = readNumber(els.pleasantness)
  const brightness = readNumber(els.brightness)
  const arousal = readNumber(els.arousal)
  const valence = readNumber(els.valence)
  const simultaneity = readNumber(els.simultaneity)

  els.volumeOut.value = volume.toFixed(2)
  els.debounceOut.value = String(debounceMs)
  els.pleasantnessOut.value = pleasantness.toFixed(2)
  els.brightnessOut.value = brightness.toFixed(2)
  els.arousalOut.value = arousal.toFixed(2)
  els.valenceOut.value = valence.toFixed(2)
  els.simultaneityOut.value = simultaneity.toFixed(2)
}

function setSlider(input, output, value, digits = 2) {
  input.value = String(value)
  output.value = Number(value).toFixed(digits)
}

function applyPreset(name) {
  const presets = {
    calm: {
      volume: 0.35,
      debounceMs: 80,
      pleasantness: 0.9,
      brightness: 0.45,
      arousal: 0.25,
      valence: 0.75,
      simultaneity: 1,
    },
    balanced: {
      volume: 0.5,
      debounceMs: 50,
      pleasantness: 0.7,
      brightness: 0.6,
      arousal: 0.6,
      valence: 0.6,
      simultaneity: 1,
    },
    tense: {
      volume: 0.55,
      debounceMs: 30,
      pleasantness: 0.25,
      brightness: 0.75,
      arousal: 0.85,
      valence: 0.35,
      simultaneity: 0.9,
    },
    chaotic: {
      volume: 0.62,
      debounceMs: 10,
      pleasantness: 0.15,
      brightness: 0.9,
      arousal: 0.95,
      valence: 0.3,
      simultaneity: 0.15,
    },
  }

  const preset = presets[name]
  if (!preset) return

  setSlider(els.volume, els.volumeOut, preset.volume)
  setSlider(els.debounce, els.debounceOut, preset.debounceMs, 0)
  setSlider(els.pleasantness, els.pleasantnessOut, preset.pleasantness)
  setSlider(els.brightness, els.brightnessOut, preset.brightness)
  setSlider(els.arousal, els.arousalOut, preset.arousal)
  setSlider(els.valence, els.valenceOut, preset.valence)
  setSlider(els.simultaneity, els.simultaneityOut, preset.simultaneity)

  scheduleRebuild(`Applied ${name} preset`)
}

function showScene(index) {
  if (index < 0 || index >= scenes.length) return
  currentSceneIndex = index
  const scene = scenes[currentSceneIndex]

  document.querySelectorAll('.scene').forEach((node) => {
    const isActive = Number(node.getAttribute('data-scene')) === scene.id
    node.classList.toggle('is-hidden', !isActive)
  })

  if (els.sceneIndicator) {
    els.sceneIndicator.textContent = `Scene ${scene.id} of ${scenes.length} - ${scene.title}`
  }
  if (els.sceneHint) {
    els.sceneHint.textContent = scene.hint
  }
  if (els.prevScene) {
    els.prevScene.disabled = currentSceneIndex === 0
  }
  if (els.nextScene) {
    els.nextScene.disabled = currentSceneIndex === scenes.length - 1
  }

  els.sceneChips.forEach((chip, chipIndex) => {
    const isActive = chipIndex === currentSceneIndex
    chip.classList.toggle('is-active', isActive)
  })
}

function getTuning() {
  return {
    enabled: readBool(els.toggleSound),
    volume: readNumber(els.volume),
    debounceMs: readNumber(els.debounce),
    aesthetics: {
      pleasantness: readNumber(els.pleasantness),
      brightness: readNumber(els.brightness),
      arousal: readNumber(els.arousal),
      valence: readNumber(els.valence),
      simultaneity: readNumber(els.simultaneity),
      baseMidi: 69,
    },
  }
}

function pickStatus() {
  const states = ['idle', 'loading', 'success', 'error']
  return states[Math.floor(Math.random() * states.length)]
}

function createStateCreator(dataState) {
  return (set) => ({
    ...dataState,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    toggle: () => set((state) => ({ toggled: !state.toggled })),
    addItem: () =>
      set((state) => ({ items: [...state.items, `Item ${Math.floor(Math.random() * 1000)}`] })),
    removeItem: () => set((state) => ({ items: state.items.slice(0, -1) })),
    updateString: () => set({ status: pickStatus() }),
    reset: () => set(initialDataState),
    setLastEvent: (event) => set({ lastEvent: event }),
    updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
  })
}

let store = null
let unsubscribe = null

function getDataState(currentStore) {
  if (!currentStore) return initialDataState
  const current = currentStore.getState()
  return {
    count: current.count,
    toggled: current.toggled,
    status: current.status,
    items: current.items,
    lastEvent: current.lastEvent,
    user: current.user,
  }
}

function rebuildStore(reason) {
  const prev = store
  const prevData = getDataState(prev)

  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }

  if (prev) {
    prev.zusoundCleanup?.()
    prev.destroy?.()
  }

  const tuning = getTuning()
  const options = {
    enabled: tuning.enabled,
    volume: tuning.volume,
    debounceMs: tuning.debounceMs,
    aesthetics: tuning.aesthetics,
    mapChangeToAesthetics: (change) => {
      let pleasantness = tuning.aesthetics.pleasantness
      if (change.operation === 'add') pleasantness = Math.min(1, pleasantness + 0.1)
      if (change.operation === 'remove') pleasantness = Math.max(0, pleasantness - 0.2)
      return {
        pleasantness,
        brightness: tuning.aesthetics.brightness,
        arousal: tuning.aesthetics.arousal,
        valence: tuning.aesthetics.valence,
        simultaneity: tuning.aesthetics.simultaneity,
        baseMidi: tuning.aesthetics.baseMidi,
      }
    },
  }

  const isSubscriber = els.initModeSelect && els.initModeSelect.value === 'subscriber'
  let zusoundUnsub = null

  if (isSubscriber) {
    store = createStore(createStateCreator(prevData))
    const z = createZusound(options)
    const storeSub = store.subscribe(z)
    zusoundUnsub = () => {
      storeSub()
      z.cleanup()
    }
  } else {
    store = createStore(zusound(createStateCreator(prevData), options))
  }

  const logUnsub = store.subscribe((next, prevState) => {
    render(getDataState(store))
    const keys = ['count', 'toggled', 'status', 'items', 'lastEvent', 'user']
    for (const key of keys) {
      if (next[key] !== prevState[key]) {
        const type =
          key === 'items'
            ? next.items.length > prevState.items.length
              ? 'add'
              : 'remove'
            : 'update'
        logAction(`${key} changed`, type)
      }
    }
  })

  unsubscribe = () => {
    logUnsub()
    if (zusoundUnsub) zusoundUnsub()
  }

  render(getDataState(store))
  if (reason) logAction(reason, 'update')
}

syncOutputs()
updateAudioStatus(els.toggleSound.checked)
initSignalCanvas()
rebuildStore('Initialized')
showScene(0)

els.prevScene.onclick = () => showScene(currentSceneIndex - 1)
els.nextScene.onclick = () => showScene(currentSceneIndex + 1)
els.sceneChips.forEach((chip) => {
  chip.onclick = () => {
    const targetIndex = Number(chip.getAttribute('data-scene-index') ?? 0)
    if (Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < scenes.length) {
      showScene(targetIndex)
    }
  }
})

if (els.unlockAudio) {
  els.unlockAudio.onclick = () => {
    if (sceneStarts) return
    sceneStarts = true
    els.toggleSound.checked = true
    updateAudioStatus(true)
    rebuildStore('Audio enabled by user gesture')
    showScene(0)
    els.unlockAudio.textContent = 'Audio Ready'
    els.unlockAudio.disabled = true
  }
}

els.btnInc.onclick = () => store.getState().increment()
els.btnDec.onclick = () => store.getState().decrement()
els.btnToggle.onclick = () => store.getState().toggle()
els.btnAdd.onclick = () => store.getState().addItem()
els.btnRemove.onclick = () => store.getState().removeItem()
els.btnString.onclick = () => store.getState().updateString()
els.btnReset.onclick = () => store.getState().reset()
els.btnDangerBurst.onclick = () => {
  let i = 0
  const id = setInterval(() => {
    store.setState((state) => ({ ...state, count: (state.count ?? 0) + 1 }))
    if (++i >= 20) {
      clearInterval(id)
    }
  }, 25)
}
els.presetCalm.onclick = () => applyPreset('calm')
els.presetBalanced.onclick = () => applyPreset('balanced')
els.presetTense.onclick = () => applyPreset('tense')
els.presetChaotic.onclick = () => applyPreset('chaotic')

let stressInterval = null
els.btnStress.onclick = () => {
  if (stressInterval) {
    clearInterval(stressInterval)
    stressInterval = null
    els.btnStress.textContent = 'Stress Test (Random)'
    els.btnStress.classList.remove('danger')
    els.btnStress.classList.add('warning')
    return
  }

  els.btnStress.textContent = 'Stop Stress Test'
  els.btnStress.classList.remove('warning')
  els.btnStress.classList.add('danger')

  stressInterval = setInterval(() => {
    const actions = ['increment', 'decrement', 'toggle', 'addItem', 'removeItem', 'updateString']
    const action = actions[Math.floor(Math.random() * actions.length)]
    store.getState()[action]()
  }, 200)
}

els.btnApi.onclick = async () => {
  els.btnApi.disabled = true
  const originalText = els.btnApi.textContent
  els.btnApi.textContent = 'Fetching...'

  await new Promise((resolve) => setTimeout(resolve, 900))

  store.getState().updateUser({
    active: !store.getState().user.active,
    lastLogin: new Date().toISOString(),
  })

  els.btnApi.disabled = false
  els.btnApi.textContent = originalText
}

let rebuildTimer = null
function scheduleRebuild(reason) {
  syncOutputs()
  if (rebuildTimer) clearTimeout(rebuildTimer)
  rebuildTimer = setTimeout(() => rebuildStore(reason), 200)
}

els.toggleSound.onchange = () => {
  updateAudioStatus(els.toggleSound.checked)
  rebuildStore(els.toggleSound.checked ? 'Enabled' : 'Disabled')
}
if (els.initModeSelect) {
  els.initModeSelect.onchange = () => scheduleRebuild('Switched init mode')
}
els.volume.oninput = () => scheduleRebuild('Updated tuning')
els.debounce.oninput = () => scheduleRebuild('Updated tuning')
els.pleasantness.oninput = () => scheduleRebuild('Updated tuning')
els.brightness.oninput = () => scheduleRebuild('Updated tuning')
els.arousal.oninput = () => scheduleRebuild('Updated tuning')
els.valence.oninput = () => scheduleRebuild('Updated tuning')
els.simultaneity.oninput = () => scheduleRebuild('Updated tuning')

const isLocalHost =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '[::1]' ||
  location.hostname === '::1'

if (isLocalHost) {
  updateEventMode('Local SSE', 'is-local')
  const eventSource = new EventSource('/events')
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      applyExternalEvent(data, 'SSE')
    } catch (error) {
      console.warn('Unable to parse SSE payload', error)
    }
  }

  eventSource.onerror = () => {
    updateEventMode('Local SSE (offline)', 'is-local')
    if (els.signalCaption) {
      els.signalCaption.textContent =
        'Live server event stream unavailable. Core demo controls still work.'
    }
    eventSource.close()
  }
} else {
  updateEventMode('Hosted simulation', 'is-hosted')
  if (els.signalCaption) {
    els.signalCaption.textContent =
      'Hosted simulation mode: deterministic mock events are generated every 6 seconds.'
  }

  const sequence = ['hosted_ping', 'scene_transition', 'state_snapshot', 'background_sync']
  let sequenceIndex = 0

  const pushHostedEvent = () => {
    const data = {
      type: sequence[sequenceIndex % sequence.length],
      timestamp: Date.now(),
      source: 'hosted-simulation',
    }
    sequenceIndex += 1
    applyExternalEvent(data, 'Hosted')
  }

  setTimeout(pushHostedEvent, 1200)
  setInterval(pushHostedEvent, 6000)
}
