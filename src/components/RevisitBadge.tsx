import type { Problem } from '../types'
import { msUntil } from '../srs'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/** Short date, e.g. "Jun 18" (year shown only when it isn't the current year). */
export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** Coloured pill showing time until the next revisit (hours or days). */
export default function RevisitBadge({ problem }: { problem: Problem }) {
  const diff = msUntil(problem.dueDate)
  if (diff === null) return <span className="badge badge-new">new</span>

  // Overdue: a full day or more reads as "Nd overdue", otherwise it's due now.
  if (diff <= 0) {
    const over = -diff
    if (over >= DAY) {
      return <span className="badge badge-overdue">{Math.round(over / DAY)}d overdue</span>
    }
    return <span className="badge badge-due">due now</span>
  }

  // Under a day out: show hours so short intervals are readable.
  if (diff < DAY) {
    return <span className="badge badge-soon">{Math.ceil(diff / HOUR)}h left</span>
  }

  const days = Math.round(diff / DAY)
  const tone = days <= 2 ? 'badge-soon' : 'badge-later'
  return <span className={`badge ${tone}`}>{days}d left</span>
}
