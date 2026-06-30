import type { Difficulty } from '../types'

const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard']

interface Props {
  selected: Set<Difficulty>
  onToggle: (d: Difficulty) => void
  onClear: () => void
}

export default function DifficultyFilter({ selected, onToggle, onClear }: Props) {
  return (
    <div className="filter">
      <span className="filter-label">Difficulty:</span>
      <button className={`chip ${selected.size === 0 ? 'chip-on' : ''}`} onClick={onClear}>
        All
      </button>
      {DIFFS.map((d) => (
        <button
          key={d}
          className={`chip chip-diff-${d.toLowerCase()} ${selected.has(d) ? 'is-on' : ''}`}
          onClick={() => onToggle(d)}
        >
          {d}
        </button>
      ))}
    </div>
  )
}
