import type { Problem } from './types'

const KEY = 'leetcode-spaced.problems.v1'

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

export function newId(): string {
  return crypto.randomUUID()
}
