import type { Grade, Problem } from '../types'
import { solvedToday } from '../srs'
import RevisitBadge, { fmtDate as fmt } from './RevisitBadge'

interface Props {
  problem: Problem
  onGrade: (id: string, grade: Grade) => void
  onForget: (id: string) => void
  onRemove: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
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
