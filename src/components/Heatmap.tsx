import { useEffect, useMemo, useRef } from 'react'
import { localDateStr } from '../srs'

const WEEKS = 53
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Cell {
  date: string
  count: number
  future: boolean
}

function level(count: number): number {
  if (count <= 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

export default function Heatmap({ activity }: { activity: string[] }) {
  const { columns, monthLabels } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of activity) counts.set(d, (counts.get(d) ?? 0) + 1)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(start.getDate() - (WEEKS * 7 - 1))
    start.setDate(start.getDate() - start.getDay()) // back to Sunday

    const cols: Cell[][] = []
    const labels: string[] = []
    const cur = new Date(start)
    let prevMonth = -1
    while (cur <= today) {
      const col: Cell[] = []
      const colMonth = cur.getMonth()
      labels.push(colMonth !== prevMonth ? MONTHS[colMonth] : '')
      prevMonth = colMonth
      for (let d = 0; d < 7; d++) {
        const ds = localDateStr(cur)
        const future = cur > today
        col.push({ date: ds, count: future ? -1 : counts.get(ds) ?? 0, future })
        cur.setDate(cur.getDate() + 1)
      }
      cols.push(col)
    }
    return { columns: cols, monthLabels: labels }
  }, [activity])

  // Open scrolled to the most recent activity (right edge), like GitHub.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [columns])

  return (
    <div className="hm">
      <div className="hm-scroll" ref={scrollRef}>
        <div className="hm-months">
          <div className="hm-weekday-spacer" />
          {monthLabels.map((m, i) => (
            <div key={i} className="hm-month">
              {m}
            </div>
          ))}
        </div>
        <div className="hm-body">
          <div className="hm-weekdays">
            <span />
            <span>Mon</span>
            <span />
            <span>Wed</span>
            <span />
            <span>Fri</span>
            <span />
          </div>
          <div className="hm-grid">
            {columns.map((col, i) => (
              <div key={i} className="hm-col">
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    className={`hm-cell hm-l${level(cell.count)} ${cell.future ? 'hm-future' : ''}`}
                    title={cell.future ? '' : `${cell.count} on ${cell.date}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hm-legend">
        <span>Less</span>
        <span className="hm-cell hm-l0" />
        <span className="hm-cell hm-l1" />
        <span className="hm-cell hm-l2" />
        <span className="hm-cell hm-l3" />
        <span className="hm-cell hm-l4" />
        <span>More</span>
      </div>
    </div>
  )
}
