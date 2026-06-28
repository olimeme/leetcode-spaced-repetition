import type { Period, Problem, SrsSettings } from './types'
import { DEFAULT_SETTINGS } from './srs'

const KEY = 'leetcode-spaced.problems.v1'
const SETTINGS_KEY = 'leetcode-spaced.settings.v1'

export function loadProblems(): Problem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Problem[]) : []
  } catch {
    return []
  }
}

export function saveProblems(problems: Problem[]): void {
  localStorage.setItem(KEY, JSON.stringify(problems))
}

function parsePeriod(raw: unknown, fallback: Period): Period {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>
    const value = Number(r.value)
    const unit = r.unit === 'hours' || r.unit === 'days' ? r.unit : null
    if (value > 0 && unit) return { value: Math.round(value), unit }
  }
  return fallback
}

export function loadSettings(): SrsSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    // merge over defaults so missing/invalid keys fall back safely
    return {
      easy: parsePeriod(parsed.easy, DEFAULT_SETTINGS.easy),
      medium: parsePeriod(parsed.medium, DEFAULT_SETTINGS.medium),
      hard: parsePeriod(parsed.hard, DEFAULT_SETTINGS.hard),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: SrsSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function newId(): string {
  return crypto.randomUUID()
}
