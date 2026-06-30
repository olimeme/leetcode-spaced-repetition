import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Problem, SrsSettings } from './types'
import {
  DEFAULT_SETTINGS,
  applyGrade,
  columnOf,
  forgetProblem,
  isDue,
  msUntil,
  moveToColumn,
  periodToHours,
  solvedToday,
} from './srs'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// Freeze time at local noon so start-of-day math is timezone-stable.
const NOW = new Date(2026, 5, 15, 12, 0, 0)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

function makeProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: 'x',
    title: 'Two Sum',
    url: 'https://leetcode.com/problems/two-sum/',
    slug: 'two-sum',
    difficulty: 'Easy',
    topics: ['Array'],
    dateAdded: NOW.toISOString(),
    lastSolved: null,
    intervalDays: 0,
    dueDate: null,
    solvedCount: 0,
    ...overrides,
  }
}

const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString()

describe('periodToHours', () => {
  it('converts days to hours', () => {
    expect(periodToHours({ value: 7, unit: 'days' })).toBe(168)
  })
  it('passes hours through', () => {
    expect(periodToHours({ value: 5, unit: 'hours' })).toBe(5)
  })
  it('rounds and clamps to at least 1', () => {
    expect(periodToHours({ value: 0, unit: 'days' })).toBe(1)
    expect(periodToHours({ value: 2.4, unit: 'hours' })).toBe(2)
  })
})

describe('msUntil', () => {
  it('returns null for no due date', () => {
    expect(msUntil(null)).toBeNull()
  })
  it('is positive in the future, negative in the past', () => {
    expect(msUntil(at(2 * HOUR))).toBe(2 * HOUR)
    expect(msUntil(at(-2 * HOUR))).toBe(-2 * HOUR)
  })
})

describe('isDue', () => {
  it('is false without a due date', () => {
    expect(isDue(makeProblem())).toBe(false)
  })
  it('is true when due now or in the past', () => {
    expect(isDue(makeProblem({ dueDate: at(0) }))).toBe(true)
    expect(isDue(makeProblem({ dueDate: at(-HOUR) }))).toBe(true)
  })
  it('is false when the due date is in the future', () => {
    expect(isDue(makeProblem({ dueDate: at(HOUR) }))).toBe(false)
  })
})

describe('solvedToday', () => {
  it('is false when never solved', () => {
    expect(solvedToday(makeProblem())).toBe(false)
  })
  it('is true when last solved today', () => {
    expect(solvedToday(makeProblem({ lastSolved: at(-HOUR) }))).toBe(true)
  })
  it('is false when last solved on a previous day', () => {
    expect(solvedToday(makeProblem({ lastSolved: at(-2 * DAY) }))).toBe(false)
  })
})

describe('columnOf', () => {
  it('backlog: never solved, not scheduled', () => {
    expect(columnOf(makeProblem())).toBe('backlog')
  })
  it('today: due now or overdue (wins over solved-today)', () => {
    expect(columnOf(makeProblem({ dueDate: at(-HOUR), lastSolved: at(-HOUR) }))).toBe('today')
  })
  it('upcoming: coming back later today, even if solved today', () => {
    const p = makeProblem({ lastSolved: at(0), dueDate: at(2 * HOUR) })
    expect(columnOf(p)).toBe('upcoming')
  })
  it('solved: solved today and parked until another day', () => {
    const p = makeProblem({ lastSolved: at(0), dueDate: at(2 * DAY) })
    expect(columnOf(p)).toBe('solved')
  })
  it('upcoming: scheduled in the future but not solved today', () => {
    const p = makeProblem({ lastSolved: at(-3 * DAY), dueDate: at(2 * DAY) })
    expect(columnOf(p)).toBe('upcoming')
  })
})

describe('applyGrade', () => {
  it('schedules a day-based grade and marks it solved today', () => {
    const result = applyGrade(makeProblem(), 'easy', DEFAULT_SETTINGS)
    expect(result.dueDate).toBe(at(7 * DAY))
    expect(result.lastSolved).toBe(NOW.toISOString())
    expect(result.intervalDays).toBe(7)
    expect(result.solvedCount).toBe(1)
    expect(columnOf(result)).toBe('solved')
  })

  it('schedules an hour-based grade into Upcoming the same day', () => {
    const settings: SrsSettings = {
      ...DEFAULT_SETTINGS,
      hard: { value: 2, unit: 'hours' },
    }
    const result = applyGrade(makeProblem(), 'hard', settings)
    expect(result.dueDate).toBe(at(2 * HOUR))
    expect(columnOf(result)).toBe('upcoming')
  })

  it('does not mutate the original problem', () => {
    const p = makeProblem()
    applyGrade(p, 'medium', DEFAULT_SETTINGS)
    expect(p.solvedCount).toBe(0)
    expect(p.dueDate).toBeNull()
  })
})

describe('forgetProblem', () => {
  it('makes a problem due now and resets its interval, keeping history', () => {
    const p = makeProblem({ lastSolved: at(-3 * DAY), dueDate: at(2 * DAY), intervalDays: 5 })
    const result = forgetProblem(p)
    expect(result.intervalDays).toBe(0)
    expect(result.lastSolved).toBe(p.lastSolved) // older solve kept
    expect(columnOf(result)).toBe('today')
  })

  it('clears a same-day solve so it leaves Solved Today', () => {
    const p = makeProblem({ lastSolved: at(0), dueDate: at(2 * DAY), intervalDays: 7 })
    const result = forgetProblem(p)
    expect(result.lastSolved).toBeNull()
    expect(columnOf(result)).toBe('today')
  })
})

describe('moveToColumn', () => {
  it('backlog: clears scheduling', () => {
    const p = makeProblem({ lastSolved: at(-DAY), dueDate: at(DAY), intervalDays: 3 })
    const result = moveToColumn(p, 'backlog')
    expect(result.lastSolved).toBeNull()
    expect(result.dueDate).toBeNull()
    expect(result.intervalDays).toBe(0)
    expect(columnOf(result)).toBe('backlog')
  })

  it('today: becomes due now', () => {
    expect(columnOf(moveToColumn(makeProblem(), 'today'))).toBe('today')
  })

  it('upcoming: lands in Upcoming even from a solved-today card', () => {
    const p = makeProblem({ lastSolved: at(0), intervalDays: 5 })
    expect(columnOf(moveToColumn(p, 'upcoming'))).toBe('upcoming')
  })

  it('solved: lands in Solved Today even with a tiny interval', () => {
    const p = makeProblem({ intervalDays: 0 })
    expect(columnOf(moveToColumn(p, 'solved'))).toBe('solved')
  })
})
