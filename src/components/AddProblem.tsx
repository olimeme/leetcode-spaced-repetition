import { useState } from 'react'
import type { Problem } from '../types'
import { fetchMeta, parseSlug } from '../leetcode'
import { newId } from '../storage'
import { todayISO } from '../srs'
import { PlusIcon } from '../icons'

interface Props {
  existingSlugs: Set<string>
  onAdd: (p: Problem) => void
}

type AddResult = 'added' | 'dup' | 'invalid' | 'error'

export default function AddProblem({ existingSlugs, onAdd }: Props) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [badLines, setBadLines] = useState<string[]>([])
  const [errorLines, setErrorLines] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  async function addOne(rawUrl: string): Promise<AddResult> {
    const url = rawUrl.trim()
    if (!url) return 'invalid'
    const slug = parseSlug(url)
    if (!slug) return 'invalid'
    if (existingSlugs.has(slug)) return 'dup'

    // Verify the problem actually exists on LeetCode before adding it.
    const res = await fetchMeta(slug)
    if (res.status === 'error') return 'error'
    if (res.status === 'invalid') return 'invalid'

    const { meta } = res
    const problem: Problem = {
      id: newId(),
      title: meta.title,
      url: `https://leetcode.com/problems/${meta.slug}/`,
      slug: meta.slug,
      difficulty: meta.difficulty,
      topics: meta.topics,
      dateAdded: todayISO(),
      lastSolved: null,
      intervalDays: 0,
      dueDate: null,
      solvedCount: 0,
    }
    onAdd(problem)
    existingSlugs.add(meta.slug)
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
    setErrorLines([])
    let added = 0
    let dup = 0
    const bad: string[] = []
    const errored: string[] = []
    for (const line of lines) {
      const r = await addOne(line)
      if (r === 'added') added++
      else if (r === 'dup') dup++
      else if (r === 'error') errored.push(line)
      else bad.push(line)
    }
    setBusy(false)
    // keep any links that failed in the box so they can be retried/fixed
    setInput([...bad, ...errored].join('\n'))
    setBadLines(bad)
    setErrorLines(errored)

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
        rows={1}
        disabled={busy}
      />
      <button className="add-btn" onClick={submit} disabled={busy || !input.trim()}>
        {busy ? (
          'Fetching…'
        ) : (
          <>
            <PlusIcon />
            Add to backlog
          </>
        )}
      </button>
      {status && <span className="add-status">{status}</span>}
      {badLines.length > 0 && (
        <span className="add-error">
          {badLines.length === 1
            ? 'Incorrect link — no such LeetCode problem'
            : `${badLines.length} incorrect links — no such LeetCode problems`}
        </span>
      )}
      {errorLines.length > 0 && (
        <span className="add-error">
          Couldn’t reach LeetCode to verify
          {errorLines.length > 1 ? ` ${errorLines.length} links` : ''} — try again
        </span>
      )}
    </div>
  )
}
