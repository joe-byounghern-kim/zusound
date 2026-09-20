import type { Change } from './types'

/**
 * Retains only the latest pending change per path while preserving the order
 * in which each path was last observed.
 */
export interface ChangeBuffer {
  readonly size: number
  add: (changes: Change[]) => void
  flush: () => Change[]
  clear: () => void
}

export function createChangeBuffer(): ChangeBuffer {
  const latestByPath = new Map<string, Change>()

  return {
    get size() {
      return latestByPath.size
    },
    add(changes) {
      for (const change of changes) {
        latestByPath.delete(change.path)
        latestByPath.set(change.path, change)
      }
    },
    flush() {
      const changes = [...latestByPath.values()]
      latestByPath.clear()
      return changes
    },
    clear() {
      latestByPath.clear()
    },
  }
}
