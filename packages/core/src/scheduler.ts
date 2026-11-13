/**
 * Lookahead audio task scheduler.
 *
 * Uses a polling loop to dispatch audio tasks slightly ahead of their
 * scheduled time, preventing Web Audio API timing jitter caused by
 * JavaScript event loop latency. Inspired by Chris Wilson's "A Tale of
 * Two Clocks" scheduling pattern.
 */

type ScheduledItem = {
  time: number
  id: number
  run: () => void
}

type SchedulerState = {
  items: ScheduledItem[]
  timer: ReturnType<typeof setTimeout> | null
  microtaskScheduled: boolean
  nextId: number
  /** Polling interval for the scheduler pump (ms). */
  lookaheadMs: number
  /** How far ahead of the current time to dispatch queued tasks (seconds). */
  scheduleAheadSeconds: number
}

const schedulers = new WeakMap<AudioContext, SchedulerState>()

function getState(ctx: AudioContext): SchedulerState {
  const existing = schedulers.get(ctx)
  if (existing) return existing

  const created: SchedulerState = {
    items: [],
    timer: null,
    microtaskScheduled: false,
    nextId: 1,
    lookaheadMs: 25,
    scheduleAheadSeconds: 0.1,
  }
  schedulers.set(ctx, created)
  return created
}

/**
 * Dispatch all queued items whose scheduled time falls within the
 * look-ahead horizon, then re-arm the timer if items remain.
 */
function pump(ctx: AudioContext): void {
  const state = getState(ctx)
  state.timer = null
  state.microtaskScheduled = false

  const horizon = ctx.currentTime + state.scheduleAheadSeconds
  while (state.items.length > 0 && state.items[0].time <= horizon) {
    const item = state.items.shift()
    if (!item) break
    try {
      item.run()
    } catch (error) {
      console.debug('Zusound: Scheduled audio task failed', error)
    }
  }

  if (state.items.length > 0) {
    state.timer = setTimeout(() => pump(ctx), state.lookaheadMs)
  }
}

/**
 * Schedule an audio task to run at the given AudioContext time.
 * Returns an ID for the scheduled task, or -1 if the time is invalid.
 */
export function scheduleAudioTask(ctx: AudioContext, time: number, run: () => void): number {
  if (!Number.isFinite(time) || time < 0) {
    console.debug('Zusound: Ignoring invalid scheduled time', time)
    return -1
  }

  const state = getState(ctx)
  const id = state.nextId++

  const item: ScheduledItem = { time, id, run }
  const items = state.items
  let inserted = false
  for (let i = 0; i < items.length; i++) {
    if (time < items[i].time) {
      items.splice(i, 0, item)
      inserted = true
      break
    }
  }
  if (!inserted) items.push(item)

  if (!state.timer && !state.microtaskScheduled) {
    state.microtaskScheduled = true
    // Use queueMicrotask where available for prompt first dispatch;
    // fall back to Promise.resolve() for older environments.
    const enqueue =
      typeof queueMicrotask === 'function'
        ? queueMicrotask
        : (fn: () => void) => Promise.resolve().then(fn)
    enqueue(() => pump(ctx))
  }

  return id
}

/** Cancel all pending tasks and stop the scheduler for the given context. */
export function stopAudioScheduler(ctx: AudioContext): void {
  const state = getState(ctx)
  state.items = []
  if (state.timer) {
    clearTimeout(state.timer)
    state.timer = null
  }
}
