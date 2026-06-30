import { useEffect, useMemo, useState } from 'react'
import { localDateStr } from '../srs'
import { ActivityIcon, CloseIcon } from '../icons'
import Heatmap from './Heatmap'

function computeStats(activity: string[]) {
  const days = new Set(activity)

  // current streak: consecutive days ending today
  let current = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (days.has(localDateStr(d))) {
    current++
    d.setDate(d.getDate() - 1)
  }

  // longest streak across all active days
  let longest = 0
  let run = 0
  let prev: number | null = null
  for (const ds of [...days].sort()) {
    const t = new Date(ds + 'T00:00:00').getTime()
    run = prev !== null && t - prev === 86_400_000 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = t
  }

  return { total: activity.length, activeDays: days.size, current, longest }
}

export default function Activity({ activity }: { activity: string[] }) {
  const [open, setOpen] = useState(false)
  const onClose = () => setOpen(false)
  const stats = useMemo(() => computeStats(activity), [activity])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        className="icon-btn"
        onClick={() => setOpen(true)}
        title="Activity"
        aria-label="Activity"
      >
        <ActivityIcon size={16} />
      </button>

      {open && (
        <div className="modal-backdrop" onClick={onClose}>
          <div
            className="modal modal-wide"
            role="dialog"
            aria-modal="true"
            aria-label="Activity"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>Activity</h2>
              <button className="modal-close" aria-label="Close" onClick={onClose}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="stats">
                <div className="stat">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">solves</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.activeDays}</span>
                  <span className="stat-label">active days</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.current}</span>
                  <span className="stat-label">day streak</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.longest}</span>
                  <span className="stat-label">longest streak</span>
                </div>
              </div>

              <Heatmap activity={activity} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
