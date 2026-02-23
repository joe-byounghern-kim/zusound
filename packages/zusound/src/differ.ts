/**
 * Change detection system.
 *
 * Performs shallow-first comparison for performance, falling back to
 * JSON serialization only when the shallow check cannot determine
 * equality. Returns `Change` objects with path, operation, and value
 * type metadata for each top-level key that differs between states.
 */

import type { Change } from './types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/** Determine the type of a value */
function getValueType(value: unknown): Change['valueType'] {
  if (value === null || value === undefined) return 'object'
  if (Array.isArray(value)) return 'array'
  const valueType = typeof value
  if (valueType === 'string') return 'string'
  if (valueType === 'number') return 'number'
  if (valueType === 'boolean') return 'boolean'
  return 'object'
}

/** Safely stringify values for comparison (fallback for complex cases) */
function safeStringify(value: unknown): { ok: true; value: string } | { ok: false } {
  try {
    if (value === null) return { ok: true, value: 'null' }
    if (value === undefined) return { ok: true, value: 'undefined' }
    if (typeof value === 'function') return { ok: true, value: '[Function]' }
    const serialized = JSON.stringify(value)
    if (serialized === undefined) return { ok: false }
    return { ok: true, value: serialized }
  } catch {
    return { ok: false }
  }
}

function mapEqual(a: Map<unknown, unknown>, b: Map<unknown, unknown>): boolean {
  if (a.size !== b.size) return false
  for (const [key, value] of a) {
    if (!b.has(key) || !Object.is(value, b.get(key))) return false
  }
  return true
}

function setEqual(a: Set<unknown>, b: Set<unknown>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}

/**
 * Shallow equality check for objects and arrays
 * Much faster than JSON.stringify for most use cases
 */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (!a || !b) return false

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => item === b[index])
  }

  // Handle objects
  if (isPlainObject(a) && isPlainObject(b)) {
    const objA = a
    const objB = b
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)
    if (keysA.length !== keysB.length) return false
    return keysA.every((key) => objA[key] === objB[key])
  }

  return false
}

/**
 * Two-tier equality check:
 * 1. Fast path — reference equality and shallow property comparison.
 * 2. Slow path — JSON serialization (only when shallow check cannot determine equality).
 *
 * The fast path handles the vast majority of Zustand state updates
 * (single-property changes with primitive values), keeping the overhead
 * near zero for typical usage.
 */
function valuesEqual(currentValue: unknown, prevValue: unknown): boolean {
  // Fast path for primitives and same reference
  if (currentValue === prevValue) return true

  // Handle null/undefined cases
  if (
    currentValue === null ||
    currentValue === undefined ||
    prevValue === null ||
    prevValue === undefined
  ) {
    return currentValue === prevValue
  }

  // For objects and arrays, try shallow comparison first
  if (typeof currentValue === 'object' && typeof prevValue === 'object') {
    if (currentValue instanceof Date && prevValue instanceof Date) {
      return currentValue.getTime() === prevValue.getTime()
    }

    if (currentValue instanceof Map && prevValue instanceof Map) {
      return mapEqual(currentValue, prevValue)
    }

    if (currentValue instanceof Set && prevValue instanceof Set) {
      return setEqual(currentValue, prevValue)
    }

    if (
      !Array.isArray(currentValue) &&
      !Array.isArray(prevValue) &&
      (!isPlainObject(currentValue) || !isPlainObject(prevValue))
    ) {
      return false
    }

    // Try shallow comparison first (much faster)
    if (shallowEqual(currentValue, prevValue)) return true

    // Fall back to string comparison for deeply nested changes
    // This is the expensive operation we're trying to minimize
    const serializedCurrent = safeStringify(currentValue)
    const serializedPrev = safeStringify(prevValue)
    if (!serializedCurrent.ok || !serializedPrev.ok) return false
    return serializedCurrent.value === serializedPrev.value
  }

  // For primitives that aren't equal
  return false
}

/**
 * Simple change detection - compares two state objects
 * Returns array of changes found with optimized comparison
 */
export function detectChanges(currentState: unknown, prevState: unknown): Change[] {
  const changes: Change[] = []

  // Handle non-object states
  if (
    typeof currentState !== 'object' ||
    currentState === null ||
    typeof prevState !== 'object' ||
    prevState === null
  ) {
    if (currentState !== prevState) {
      changes.push({
        path: 'root',
        operation: 'update',
        valueType: getValueType(currentState),
        newValue: currentState,
        oldValue: prevState,
      })
    }
    return changes
  }

  const currentRecord = currentState as Record<string, unknown>
  const prevRecord = prevState as Record<string, unknown>

  // Get all unique keys from both states
  const allKeys = new Set([...Object.keys(currentRecord), ...Object.keys(prevRecord)])

  for (const key of allKeys) {
    const currentValue = currentRecord[key]
    const prevValue = prevRecord[key]

    // Key was added
    if (!(key in prevRecord) && key in currentRecord) {
      changes.push({
        path: key,
        operation: 'add',
        valueType: getValueType(currentValue),
        newValue: currentValue,
        oldValue: undefined,
      })
      continue
    }

    // Key was removed
    if (key in prevRecord && !(key in currentRecord)) {
      changes.push({
        path: key,
        operation: 'remove',
        valueType: getValueType(prevValue),
        newValue: undefined,
        oldValue: prevValue,
      })
      continue
    }

    // Key was updated - use optimized comparison
    if (key in prevRecord && key in currentRecord) {
      if (!valuesEqual(currentValue, prevValue)) {
        changes.push({
          path: key,
          operation: 'update',
          valueType: getValueType(currentValue),
          newValue: currentValue,
          oldValue: prevValue,
        })
      }
    }
  }

  return changes
}
