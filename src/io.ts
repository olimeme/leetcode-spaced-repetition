import type { Problem } from './types'

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

export function exportJSON(problems: Problem[]): void {
  download(`leetcode-spaced-${stamp()}.json`, JSON.stringify(problems, null, 2), 'application/json')
}

const CSV_COLUMNS: (keyof Problem)[] = [
  'title',
  'url',
  'slug',
  'difficulty',
  'topics',
  'dateAdded',
  'lastSolved',
  'intervalDays',
  'dueDate',
  'solvedCount',
]

function csvCell(value: unknown): string {
  const s = Array.isArray(value) ? value.join('; ') : value == null ? '' : String(value)
  // quote if it contains a comma, quote, or newline
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCSV(problems: Problem[]): void {
  const header = CSV_COLUMNS.join(',')
  const rows = problems.map((p) => CSV_COLUMNS.map((c) => csvCell(p[c])).join(','))
  download(`leetcode-spaced-${stamp()}.csv`, [header, ...rows].join('\n'), 'text/csv')
}

/** Parse a previously exported JSON file back into problems (with light validation). */
export function parseImportedJSON(text: string): Problem[] {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('Expected a JSON array of problems')
  return data
    .filter((p) => p && typeof p.slug === 'string' && typeof p.title === 'string')
    .map((p) => ({
      id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
      title: p.title,
      url: p.url ?? `https://leetcode.com/problems/${p.slug}/`,
      slug: p.slug,
      difficulty: p.difficulty ?? null,
      topics: Array.isArray(p.topics) ? p.topics : [],
      dateAdded: p.dateAdded ?? new Date().toISOString(),
      lastSolved: p.lastSolved ?? null,
      intervalDays: typeof p.intervalDays === 'number' ? p.intervalDays : 0,
      dueDate: p.dueDate ?? null,
      solvedCount: typeof p.solvedCount === 'number' ? p.solvedCount : 0,
    }))
}
