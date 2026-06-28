interface Props {
  topics: string[]
  selected: Set<string>
  onToggle: (topic: string) => void
  onClear: () => void
}

export default function TopicFilter({ topics, selected, onToggle, onClear }: Props) {
  if (topics.length === 0) return null
  return (
    <div className="filter">
      <span className="filter-label">Topics:</span>
      <button
        className={`chip ${selected.size === 0 ? 'chip-on' : ''}`}
        onClick={onClear}
      >
        All
      </button>
      {topics.map((t) => (
        <button
          key={t}
          className={`chip ${selected.has(t) ? 'chip-on' : ''}`}
          onClick={() => onToggle(t)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
