import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Grade, Problem } from './types'
import type { Difficulty, SrsSettings } from './types'
import type { Backup } from './backup'
import {
  loadActivity,
  loadProblems,
  loadSettings,
  loadUpdatedAt,
  saveActivity,
  saveProblems,
  saveSettings,
  saveUpdatedAt,
} from './storage'
import { applyGrade, columnOf, forgetProblem, localDateStr, moveToColumn } from './srs'
import type { ColumnKey } from './srs'
import { supabase } from './supabase'
import { fetchBoard, pushBoard, type Board, type SyncStatus } from './sync'
import { useHistory } from './useHistory'
import AddProblem from './components/AddProblem'
import ProblemCard from './components/ProblemCard'
import Help from './components/Help'
import Settings from './components/Settings'
import Activity from './components/Activity'
import Account from './components/Account'
import TopicFilter from './components/TopicFilter'
import DifficultyFilter from './components/DifficultyFilter'
import { KeyboardIcon, MoonIcon, SunIcon } from './icons'

type Theme = 'light' | 'dark'
const THEME_KEY = 'leetcode-spaced.theme'

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
  const [selectedDiffs, setSelectedDiffs] = useState<Set<Difficulty>>(new Set())
  const [settings, setSettings] = useState<SrsSettings>(() => loadSettings())
  const [activity, setActivity] = useState<string[]>(() => {
    const stored = loadActivity()
    if (stored.length) return stored
    // first run: backfill from existing last-solved dates so the heatmap isn't empty
    return loadProblems()
      .filter((p) => p.lastSolved)
      .map((p) => localDateStr(new Date(p.lastSolved as string)))
  })
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<ColumnKey | null>(null)
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.getAttribute('data-theme') as Theme) || 'light',
  )
  const [session, setSession] = useState<Session | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  // Sync bookkeeping: skip the mount render, don't re-push board data we just
  // pulled from the server, and only push once the initial pull has finished.
  const firstChange = useRef(true)
  const applyingRemote = useRef(false)
  const syncReady = useRef(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  /** Overwrite local state with a board pulled from the server. */
  const applyRemoteBoard = (board: Board) => {
    applyingRemote.current = true
    setProblems(board.problems)
    setSettings(board.settings)
    setActivity(board.activity)
    saveUpdatedAt(board.updatedAt)
  }

  useEffect(() => {
    saveProblems(problems)
  }, [problems])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveActivity(activity)
  }, [activity])

  // --- Cross-device sync (optional; only when a backend is configured) ---

  // Track the auth session.
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // On sign-in, reconcile local vs server (last-write-wins), then allow pushes.
  useEffect(() => {
    if (!supabase || !session) {
      syncReady.current = false
      return
    }
    let cancelled = false
    setSyncStatus('syncing')
    ;(async () => {
      try {
        const remote = await fetchBoard(session.user.id)
        if (cancelled) return
        if (remote && remote.updatedAt > loadUpdatedAt()) {
          applyRemoteBoard(remote)
        } else {
          const updatedAt = loadUpdatedAt() || new Date().toISOString()
          saveUpdatedAt(updatedAt)
          await pushBoard(session.user.id, { problems, settings, activity, updatedAt })
        }
        if (!cancelled) {
          syncReady.current = true
          setSyncStatus('synced')
        }
      } catch {
        if (!cancelled) setSyncStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // Push local changes (debounced). Skips the mount render and remote-applied ones.
  useEffect(() => {
    if (firstChange.current) {
      firstChange.current = false
      return
    }
    if (applyingRemote.current) {
      applyingRemote.current = false
      return
    }
    const updatedAt = new Date().toISOString()
    saveUpdatedAt(updatedAt)
    if (!supabase || !session || !syncReady.current) return
    setSyncStatus('syncing')
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      try {
        await pushBoard(session.user.id, { problems, settings, activity, updatedAt: loadUpdatedAt() })
        setSyncStatus('synced')
      } catch {
        setSyncStatus('error')
      }
    }, 1200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems, settings, activity])

  // Pull newer server changes when the tab regains focus (other devices).
  useEffect(() => {
    if (!supabase || !session) return
    const onFocus = async () => {
      try {
        const remote = await fetchBoard(session.user.id)
        if (remote && remote.updatedAt > loadUpdatedAt()) {
          applyRemoteBoard(remote)
          setSyncStatus('synced')
        }
      } catch {
        /* ignore transient focus-pull errors */
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const signIn = () =>
    supabase?.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

  const signOut = async () => {
    await supabase?.auth.signOut()
    syncReady.current = false
    setSyncStatus('idle')
  }

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

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

  const gradeProblem = (id: string, grade: Grade) => {
    setProblems((prev) => prev.map((p) => (p.id === id ? applyGrade(p, grade, settings) : p)))
    setActivity((prev) => [...prev, localDateStr()])
  }

  const forgetById = (id: string) =>
    setProblems((prev) => prev.map((p) => (p.id === id ? forgetProblem(p) : p)))

  const removeProblem = (id: string) =>
    setProblems((prev) => prev.filter((p) => p.id !== id))

  /** Restore a backup: merge problems by slug, apply settings, keep activity history. */
  const importBackup = ({ problems: incoming, settings: imported, activity: log }: Backup) => {
    setProblems((prev) => {
      const bySlug = new Map(prev.map((p) => [p.slug, p]))
      for (const p of incoming) bySlug.set(p.slug, p)
      return [...bySlug.values()]
    })
    setSettings(imported)
    if (log.length) setActivity((prev) => [...prev, ...log])
  }

  // Dev-only time travel: shift every stored date back by `days`, which is
  // equivalent to advancing the app's clock forward (so cards become due).
  const skipDays = (days: number) => {
    const shift = (iso: string | null) =>
      iso ? new Date(new Date(iso).getTime() - days * 86_400_000).toISOString() : iso
    setProblems((prev) =>
      prev.map((p) => ({
        ...p,
        dateAdded: shift(p.dateAdded) as string,
        lastSolved: shift(p.lastSolved),
        dueDate: shift(p.dueDate),
      })),
    )
  }

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
    if (selectedTopics.size === 0 && selectedDiffs.size === 0) return problems
    return problems.filter((p) => {
      if (selectedTopics.size && !p.topics.some((t) => selectedTopics.has(t))) return false
      if (selectedDiffs.size && !(p.difficulty && selectedDiffs.has(p.difficulty))) return false
      return true
    })
  }, [problems, selectedTopics, selectedDiffs])

  const columns = useMemo(() => {
    const buckets: Record<ColumnKey, Problem[]> = {
      backlog: [],
      today: [],
      upcoming: [],
      solved: [],
    }
    for (const p of visible) buckets[columnOf(p)].push(p)
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

  const toggleDiff = (d: Difficulty) =>
    setSelectedDiffs((prev) => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
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
          <div className="header-actions">
            {supabase && (
              <Account
                session={session}
                syncStatus={syncStatus}
                onSignIn={signIn}
                onSignOut={signOut}
              />
            )}
            <Activity activity={activity} />
            <Settings
              settings={settings}
              onChange={setSettings}
              problems={problems}
              activity={activity}
              onImport={importBackup}
            />
            <Help />
          </div>
        </div>
      </header>

      <AddProblem existingSlugs={existingSlugs} onAdd={addProblem} />

      <DifficultyFilter
        selected={selectedDiffs}
        onToggle={toggleDiff}
        onClear={() => setSelectedDiffs(new Set())}
      />

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

      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title="Toggle dark / light mode"
        aria-label="Toggle dark / light mode"
      >
        {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
      </button>

      {import.meta.env.DEV && (
        <div className="devbar">
          <span className="devbar-label">dev · time travel</span>
          <button onClick={() => skipDays(1)}>⏩ +1 day</button>
          <button onClick={() => skipDays(7)}>+7 days</button>
        </div>
      )}

      <div className="shortcuts">
        <button className="shortcuts-btn" aria-label="Keyboard shortcuts">
          <KeyboardIcon size={17} />
        </button>
        <div className="shortcuts-list" role="tooltip">
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
    </div>
  )
}
