import type { Grade, Problem } from '../types'
import { daysUntil, solvedToday } from '../srs'

interface Props {
  problem: Problem
  onGrade: (id: string, grade: Grade) => void
  onForget: (id: string) => void
  onRemove: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  // Keep it short: only show the year when it isn't the current year.
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** Coloured pill showing days until revisit. */
function RevisitBadge({ problem }: { problem: Problem }) {
  const left = daysUntil(problem.dueDate)
  if (left === null) return <span className="badge badge-new">new</span>
  if (left < 0) return <span className="badge badge-overdue">{-left}d overdue</span>
  if (left === 0) return <span className="badge badge-due">due today</span>
  const tone = left <= 2 ? 'badge-soon' : 'badge-later'
  return <span className={`badge ${tone}`}>{left}d left</span>
}

export default function ProblemCard({
  problem,
  onGrade,
  onForget,
  onRemove,
  onDragStart,
  onDragEnd,
}: Props) {
  const diff = problem.difficulty?.toLowerCase() ?? 'unknown'
  const done = solvedToday(problem)
  const everSolved = problem.solvedCount > 0

  return (
    <div
      className="card"
      draggable
      onDragStart={() => onDragStart(problem.id)}
      onDragEnd={onDragEnd}
    >
      <div className="card-top">
        <a className="card-title" href={problem.url} target="_blank" rel="noreferrer">
          {problem.title}
        </a>
        <RevisitBadge problem={problem} />
        <button className="remove" title="Remove" onClick={() => onRemove(problem.id)}>
          ×
        </button>
      </div>

      <div className="card-tags">
        <span className={`diff diff-${diff}`}>{problem.difficulty ?? '?'}</span>
        {problem.topics.slice(0, 3).map((t) => (
          <span key={t} className="topic">
            {t}
          </span>
        ))}
        {problem.topics.length > 3 && (
          <span className="topic">+{problem.topics.length - 3}</span>
        )}
      </div>

      <div className="card-meta">
        <span title="First added">added {fmt(problem.dateAdded)}</span>
        <span title="Last solved">solved {fmt(problem.lastSolved)}</span>
      </div>

      <div className="grades">
        <span className="grades-label">{done ? 'Re-grade:' : 'How hard?'}</span>
        <div className="grade-buttons">
          <button className="g g-easy" onClick={() => onGrade(problem.id, 'easy')}>
            Easy
          </button>
          <button className="g g-medium" onClick={() => onGrade(problem.id, 'medium')}>
            Medium
          </button>
          <button className="g g-hard" onClick={() => onGrade(problem.id, 'hard')}>
            Hard
          </button>
        </div>
      </div>

      {everSolved && (
        <button className="forgot" onClick={() => onForget(problem.id)}>
          ↺ I forgot it
        </button>
      )}
    </div>
  )
}
