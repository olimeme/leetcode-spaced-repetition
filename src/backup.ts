import type { Period, Problem, SrsSettings } from './types'
import { DEFAULT_SETTINGS } from './srs'

export interface Backup {
  problems: Problem[]
  settings: SrsSettings
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Download the full app state (problems + settings) as a JSON file. */
export function exportBackup(problems: Problem[], settings: SrsSettings): void {
  const payload = {
    app: 'leetcode-spaced',
    version: 1,
    exportedAt: new Date().toISOString(),
    problems,
    settings,
  }
  download(
    `leetcode-spaced-backup-${stamp()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )
}

function normalizePeriod(raw: unknown, fallback: Period): Period {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>
    const value = Number(r.value)
    const unit = r.unit === 'hours' || r.unit === 'days' ? r.unit : null
    if (value > 0 && unit) return { value: Math.round(value), unit }
  }
  return fallback
}

function normalizeSettings(raw: unknown): SrsSettings {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    easy: normalizePeriod(r.easy, DEFAULT_SETTINGS.easy),
    medium: normalizePeriod(r.medium, DEFAULT_SETTINGS.medium),
    hard: normalizePeriod(r.hard, DEFAULT_SETTINGS.hard),
  }
}

function normalizeProblem(p: Record<string, unknown>): Problem {
  return {
    id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
    title: String(p.title),
    url: typeof p.url === 'string' ? p.url : `https://leetcode.com/problems/${p.slug}/`,
    slug: String(p.slug),
    difficulty:
      p.difficulty === 'Easy' || p.difficulty === 'Medium' || p.difficulty === 'Hard'
        ? p.difficulty
        : null,
    topics: Array.isArray(p.topics) ? (p.topics as string[]) : [],
    dateAdded: typeof p.dateAdded === 'string' ? p.dateAdded : new Date().toISOString(),
    lastSolved: typeof p.lastSolved === 'string' ? p.lastSolved : null,
    intervalDays: typeof p.intervalDays === 'number' ? p.intervalDays : 0,
    dueDate: typeof p.dueDate === 'string' ? p.dueDate : null,
    solvedCount: typeof p.solvedCount === 'number' ? p.solvedCount : 0,
  }
}

/**
 * Parse a backup file. Accepts both the wrapped payload ({ problems, settings })
 * and a bare array of problems (older export format). Throws on malformed input.
 */
export function parseBackup(text: string): Backup {
  const data = JSON.parse(text)
  const rawProblems = Array.isArray(data) ? data : data?.problems
  if (!Array.isArray(rawProblems)) {
    throw new Error('No problems found in this file')
  }
  const problems = rawProblems
    .filter((p) => p && typeof p.slug === 'string' && typeof p.title === 'string')
    .map(normalizeProblem)
  const settings = normalizeSettings(Array.isArray(data) ? undefined : data?.settings)
  return { problems, settings }
}
