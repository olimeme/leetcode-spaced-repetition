import { useCallback, useState } from 'react'

type Updater<T> = T | ((prev: T) => T)

interface History<T> {
  past: T[]
  present: T
  future: T[]
}

const LIMIT = 50

/**
 * useState-compatible hook that also records an undo/redo history of `present`.
 * `set` works like a normal state setter (value or updater fn); each distinct
 * value pushes onto the undo stack and clears the redo stack.
 */
export function useHistory<T>(initial: T) {
  const [hist, setHist] = useState<History<T>>({ past: [], present: initial, future: [] })

  const set = useCallback((updater: Updater<T>) => {
    setHist((h) => {
      const next =
        typeof updater === 'function' ? (updater as (p: T) => T)(h.present) : updater
      if (Object.is(next, h.present)) return h
      const past = [...h.past, h.present].slice(-LIMIT)
      return { past, present: next, future: [] }
    })
  }, [])

  const undo = useCallback(() => {
    setHist((h) => {
      if (h.past.length === 0) return h
      const previous = h.past[h.past.length - 1]
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHist((h) => {
      if (h.future.length === 0) return h
      const [next, ...rest] = h.future
      return { past: [...h.past, h.present], present: next, future: rest }
    })
  }, [])

  return {
    state: hist.present,
    set,
    undo,
    redo,
    canUndo: hist.past.length > 0,
    canRedo: hist.future.length > 0,
  }
}
