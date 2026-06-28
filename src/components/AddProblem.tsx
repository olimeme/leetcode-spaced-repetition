import { useState } from 'react'
import type { Problem } from '../types'
import { fetchMeta, parseSlug, slugToTitle } from '../leetcode'
import { newId } from '../storage'
import { todayISO } from '../srs'

interface Props {
  existingSlugs: Set<string>
  onAdd: (p: Problem) => void
}

export default function AddProblem({ existingSlugs, onAdd }: Props) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [badLines, setBadLines] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  async function addOne(rawUrl: string): Promise<'added' | 'dup' | 'bad'> {
    const url = rawUrl.trim()
    if (!url) return 'bad'
    const slug = parseSlug(url)
    if (!slug) return 'bad'
    if (existingSlugs.has(slug)) return 'dup'

    const meta = await fetchMeta(slug)
    const problem: Problem = {
      id: newId(),
      title: meta?.title ?? slugToTitle(slug),
      url: `https://leetcode.com/problems/${slug}/`,
      slug,
      difficulty: meta?.difficulty ?? null,
      topics: meta?.topics ?? [],
      dateAdded: todayISO(),
      lastSolved: null,
      intervalDays: 0,
      dueDate: null,
      solvedCount: 0,
    }
    onAdd(problem)
    existingSlugs.add(slug)
    return 'added'
  }

  async function submit() {
    const lines = input
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (lines.length === 0) return

    setBusy(true)
    setStatus(null)
    setBadLines([])
    let added = 0
    let dup = 0
    const bad: string[] = []
    for (const line of lines) {
      const r = await addOne(line)
      if (r === 'added') added++
      else if (r === 'dup') dup++
      else bad.push(line)
    }
    setBusy(false)
    // keep the invalid links in the box so they can be fixed; clear the rest
    setInput(bad.join('\n'))
    setBadLines(bad)

    const parts: string[] = []
    if (added) parts.push(`${added} added`)
    if (dup) parts.push(`${dup} already in list`)
    setStatus(parts.length ? parts.join(' · ') : null)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter (or Cmd+Enter on macOS) submits
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!busy && input.trim()) submit()
    }
  }

  return (
    <div className="add">
      <textarea
        className="add-input"
        placeholder="Paste one or more LeetCode links (newlines or spaces between them)…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        disabled={busy}
      />
      <button className="add-btn" onClick={submit} disabled={busy || !input.trim()}>
        {busy ? 'Fetching…' : 'Add to backlog'}
      </button>
      <span className="add-hint">⌘/Ctrl + Enter</span>
      {status && <span className="add-status">{status}</span>}
      {badLines.length > 0 && (
        <div className="add-error">
          {badLines.length === 1
            ? "That isn't a LeetCode problem link:"
            : `${badLines.length} of these aren't LeetCode problem links:`}
          <ul>
            {badLines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          <span className="add-error-tip">
            Links must look like <code>leetcode.com/problems/&lt;name&gt;</code>. They've been
            kept above so you can fix them.
          </span>
        </div>
      )}
    </div>
  )
}
