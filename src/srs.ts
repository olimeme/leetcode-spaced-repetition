import type { Grade, Period, Problem, SrsSettings } from './types'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** Default revisit period for each grade. */
export const DEFAULT_SETTINGS: SrsSettings = {
  easy: { value: 7, unit: 'days' },
  medium: { value: 3, unit: 'days' },
  hard: { value: 1, unit: 'days' },
}

/** A period expressed in hours (at least 1). */
export function periodToHours(p: Period): number {
  const hours = p.unit === 'days' ? p.value * 24 : p.value
  return Math.max(1, Math.round(hours))
}

/** Strip a date to local midnight so day comparisons ignore the clock time. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function todayISO(): string {
  return startOfDay(new Date()).toISOString()
}

/** Local calendar date as "YYYY-MM-DD" (used to key activity by day). */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Milliseconds from now until `iso` (negative = overdue), or null. */
export function msUntil(iso: string | null): number | null {
  if (!iso) return null
  return new Date(iso).getTime() - Date.now()
}

export function isDue(p: Problem): boolean {
  if (!p.dueDate) return false
  return new Date(p.dueDate).getTime() <= Date.now()
}

export function solvedToday(p: Problem): boolean {
  if (!p.lastSolved) return false
  return startOfDay(new Date(p.lastSolved)).getTime() === startOfDay(new Date()).getTime()
}

/** Which board column a problem currently belongs to. */
export function columnOf(p: Problem): ColumnKey {
  if (p.lastSolved === null && p.dueDate === null) return 'backlog'
  // due-first so sub-day intervals can resurface a problem the same day
  if (isDue(p)) return 'today'
  // Coming back later *today* (hours away) belongs in Upcoming, even if it was
  // solved today — "Solved Today" is for problems parked until another day.
  if (p.dueDate) {
    const dueDay = startOfDay(new Date(p.dueDate)).getTime()
    const today = startOfDay(new Date()).getTime()
    if (dueDay <= today) return 'upcoming'
  }
  if (solvedToday(p)) return 'solved'
  return 'upcoming'
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString()
}

/** Return an updated copy of `p` after grading it now, using configured periods. */
export function applyGrade(p: Problem, grade: Grade, settings: SrsSettings): Problem {
  const hours = periodToHours(settings[grade])
  const now = Date.now()
  return {
    ...p,
    lastSolved: new Date(now).toISOString(),
    intervalDays: hours / 24, // day-equivalent; used only by drag-to-column
    dueDate: new Date(now + hours * HOUR_MS).toISOString(),
    solvedCount: p.solvedCount + 1,
  }
}

/**
 * "I forgot it" — retention reset. The problem becomes due right now (so it
 * lands in For Today) and its interval drops to 0 so the next grade starts the
 * schedule over. If it was solved today we clear that same-day solve, otherwise
 * the "Solved Today" bucket would keep it there instead of surfacing it.
 */
export function forgetProblem(p: Problem): Problem {
  return {
    ...p,
    intervalDays: 0,
    dueDate: todayISO(),
    lastSolved: solvedToday(p) ? null : p.lastSolved,
  }
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
      return {
        ...p,
        lastSolved: solvedToday(p) ? null : p.lastSolved,
        dueDate: addDays(today, Math.max(p.intervalDays, 1)),
      }
    case 'solved':
      return {
        ...p,
        lastSolved: today,
        dueDate: addDays(today, Math.max(p.intervalDays, 1)),
      }
  }
}
