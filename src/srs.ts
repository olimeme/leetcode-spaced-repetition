import type { Grade, Problem } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Strip a date to local midnight so day comparisons ignore the clock time. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function todayISO(): string {
  return startOfDay(new Date()).toISOString()
}

/** Whole calendar days from today until `iso` (negative = overdue). */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const target = startOfDay(new Date(iso)).getTime()
  const today = startOfDay(new Date()).getTime()
  return Math.round((target - today) / DAY_MS)
}

export function isDue(p: Problem): boolean {
  if (!p.dueDate) return false
  return startOfDay(new Date(p.dueDate)).getTime() <= startOfDay(new Date()).getTime()
}

export function solvedToday(p: Problem): boolean {
  if (!p.lastSolved) return false
  return startOfDay(new Date(p.lastSolved)).getTime() === startOfDay(new Date()).getTime()
}

/**
 * Simple-multiplier schedule.
 *  - hard   -> reset to 1 day
 *  - medium -> grow gently (×1.5, min 3 days)
 *  - easy   -> grow fast   (×2.5, min 4 days)
 */
export function nextInterval(prev: number, grade: Grade): number {
  switch (grade) {
    case 'hard':
      return 1
    case 'medium':
      return Math.max(3, Math.round((prev || 2) * 1.5))
    case 'easy':
      return Math.max(4, Math.round((prev || 2) * 2.5))
  }
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString()
}

/** Return an updated copy of `p` after grading it today. */
export function applyGrade(p: Problem, grade: Grade): Problem {
  const interval = nextInterval(p.intervalDays, grade)
  const due = new Date(startOfDay(new Date()).getTime() + interval * DAY_MS)
  return {
    ...p,
    lastSolved: todayISO(),
    intervalDays: interval,
    dueDate: due.toISOString(),
    solvedCount: p.solvedCount + 1,
  }
}

/**
 * "I forgot it" — retention reset. The problem becomes due right now and its
 * interval drops to 0 so the next grade starts the schedule over. `lastSolved`
 * is preserved so you keep the history of when you last actually solved it.
 */
export function forgetProblem(p: Problem): Problem {
  return { ...p, intervalDays: 0, dueDate: todayISO() }
}

export type ColumnKey = 'backlog' | 'today' | 'upcoming' | 'solved'

/**
 * Move a card into a column via drag-and-drop by setting the minimal state
 * that makes it land there. (Columns are derived from state, not stored.)
 */
export function moveToColumn(p: Problem, col: ColumnKey): Problem {
  const today = todayISO()
  switch (col) {
    case 'backlog':
      return { ...p, lastSolved: null, dueDate: null, intervalDays: 0 }
    case 'today':
      // due now; clear a same-day solve so it doesn't snap back to "Solved Today"
      return { ...p, dueDate: today, lastSolved: solvedToday(p) ? null : p.lastSolved }
    case 'upcoming':
      return { ...p, dueDate: addDays(today, Math.max(p.intervalDays, 1)) }
    case 'solved':
      return {
        ...p,
        lastSolved: today,
        dueDate: addDays(today, Math.max(p.intervalDays, 1)),
      }
  }
}
