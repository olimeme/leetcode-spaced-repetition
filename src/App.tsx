import { useEffect, useMemo, useState } from 'react'
import type { Grade, Problem } from './types'
import { loadProblems, saveProblems } from './storage'
import { applyGrade, forgetProblem, isDue, moveToColumn, solvedToday } from './srs'
import type { ColumnKey } from './srs'
import { useHistory } from './useHistory'
import AddProblem from './components/AddProblem'
import ProblemCard from './components/ProblemCard'
import Toolbar from './components/Toolbar'
import TopicFilter from './components/TopicFilter'

const COLUMNS: { key: ColumnKey; title: string; hint: string }[] = [
  { key: 'backlog', title: 'Backlog', hint: 'Problems you want to start' },
  { key: 'today', title: 'For Today', hint: 'Due for revisit now' },
  { key: 'upcoming', title: 'Upcoming', hint: 'Scheduled, not due yet' },
  { key: 'solved', title: 'Solved Today', hint: 'Graded today — next revisit shown' },
]

export default function App() {
  const { state: problems, set: setProblems, undo, redo } = useHistory<Problem[]>(
    loadProblems(),
  )
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<ColumnKey | null>(null)

  useEffect(() => {
    saveProblems(problems)
  }, [problems])

  // Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z or Ctrl+Y to redo — but not while
  // typing in a field, where these keys should drive native text editing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (typing || !(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const addProblem = (p: Problem) => setProblems((prev) => [...prev, p])

  const gradeProblem = (id: string, grade: Grade) =>
    setProblems((prev) => prev.map((p) => (p.id === id ? applyGrade(p, grade) : p)))

  const forgetById = (id: string) =>
    setProblems((prev) => prev.map((p) => (p.id === id ? forgetProblem(p) : p)))

  const removeProblem = (id: string) =>
    setProblems((prev) => prev.filter((p) => p.id !== id))

  /** Merge imported problems by slug — incoming entries win, others are kept. */
  const importProblems = (incoming: Problem[]) =>
    setProblems((prev) => {
      const bySlug = new Map(prev.map((p) => [p.slug, p]))
      for (const p of incoming) bySlug.set(p.slug, p)
      return [...bySlug.values()]
    })

  const dropOnColumn = (col: ColumnKey) => {
    if (dragId) {
      setProblems((prev) => prev.map((p) => (p.id === dragId ? moveToColumn(p, col) : p)))
    }
    setDragId(null)
    setDragOver(null)
  }

  const existingSlugs = useMemo(() => new Set(problems.map((p) => p.slug)), [problems])

  const allTopics = useMemo(() => {
    const set = new Set<string>()
    for (const p of problems) for (const t of p.topics) set.add(t)
    return [...set].sort()
  }, [problems])

  const visible = useMemo(() => {
    if (selectedTopics.size === 0) return problems
    return problems.filter((p) => p.topics.some((t) => selectedTopics.has(t)))
  }, [problems, selectedTopics])

  const columns = useMemo(() => {
    const buckets: Record<ColumnKey, Problem[]> = {
      backlog: [],
      today: [],
      upcoming: [],
      solved: [],
    }
    for (const p of visible) {
      if (solvedToday(p)) buckets.solved.push(p)
      else if (p.lastSolved === null && p.dueDate === null) buckets.backlog.push(p)
      else if (isDue(p)) buckets.today.push(p)
      else buckets.upcoming.push(p)
    }
    // backlog by date added; due/upcoming/solved by next revisit soonest first
    buckets.backlog.sort((a, b) => a.dateAdded.localeCompare(b.dateAdded))
    buckets.today.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    buckets.upcoming.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    buckets.solved.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    return buckets
  }, [visible])

  const toggleTopic = (t: string) =>
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })

  return (
    <div className="app">
      <header className="header">
        <div className="header-row">
          <div>
            <h1>LeetCode Spaced Repetition</h1>
            <p className="sub">
              Paste links, solve, grade, and let the schedule decide when each problem comes back.
            </p>
          </div>
          <Toolbar problems={problems} onImport={importProblems} />
        </div>
      </header>

      <AddProblem existingSlugs={existingSlugs} onAdd={addProblem} />

      <TopicFilter
        topics={allTopics}
        selected={selectedTopics}
        onToggle={toggleTopic}
        onClear={() => setSelectedTopics(new Set())}
      />

      <div className="board">
        {COLUMNS.map((col) => (
          <section
            key={col.key}
            className={`column ${dragOver === col.key ? 'column-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragOver !== col.key) setDragOver(col.key)
            }}
            onDragLeave={(e) => {
              // only clear when leaving the column, not when moving over a child
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null)
            }}
            onDrop={() => dropOnColumn(col.key)}
          >
            <div className="column-head">
              <h2>{col.title}</h2>
              <span className="count">{columns[col.key].length}</span>
            </div>
            <p className="column-hint">{col.hint}</p>
            <div className="column-body">
              {columns[col.key].length === 0 && <p className="empty">Nothing here yet.</p>}
              {columns[col.key].map((p) => (
                <ProblemCard
                  key={p.id}
                  problem={p}
                  onGrade={gradeProblem}
                  onForget={forgetById}
                  onRemove={removeProblem}
                  onDragStart={setDragId}
                  onDragEnd={() => {
                    setDragId(null)
                    setDragOver(null)
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="shortcuts" aria-hidden="true">
        <span>
          <kbd>⌘/Ctrl</kbd>+<kbd>↵</kbd> add
        </span>
        <span>
          <kbd>⌘/Ctrl</kbd>+<kbd>Z</kbd> undo
        </span>
        <span>
          <kbd>⌘/Ctrl</kbd>+<kbd>⇧</kbd>+<kbd>Z</kbd> redo
        </span>
      </div>
    </div>
  )
}
