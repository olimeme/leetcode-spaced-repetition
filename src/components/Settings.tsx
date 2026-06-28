import { useEffect, useState } from 'react'
import type { Grade, SrsSettings, TimeUnit } from '../types'
import { DEFAULT_SETTINGS } from '../srs'
import { CloseIcon, GearIcon } from '../icons'

interface Props {
  settings: SrsSettings
  onChange: (settings: SrsSettings) => void
}

const ROWS: { grade: Grade; label: string; cls: string }[] = [
  { grade: 'easy', label: 'Easy', cls: 'g-easy' },
  { grade: 'medium', label: 'Medium', cls: 'g-medium' },
  { grade: 'hard', label: 'Hard', cls: 'g-hard' },
]

export default function Settings({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const onClose = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const setValue = (grade: Grade, value: number) => {
    onChange({ ...settings, [grade]: { ...settings[grade], value } })
  }

  const setUnit = (grade: Grade, unit: TimeUnit) => {
    onChange({ ...settings, [grade]: { ...settings[grade], unit } })
  }

  return (
    <>
      <button
        className="icon-btn"
        onClick={() => setOpen(true)}
        title="Settings"
        aria-label="Settings"
      >
        <GearIcon size={16} />
      </button>

      {open && (
        <div className="modal-backdrop" onClick={onClose}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>Settings</h2>
              <button className="modal-close" aria-label="Close" onClick={onClose}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Set how long until a problem comes back for each grade. Applies the next time
                you grade a problem.
              </p>

              <div className="settings-rows">
                {ROWS.map(({ grade, label, cls }) => (
                  <div key={grade} className="settings-row">
                    <span className={`settings-grade ${cls}`}>{label}</span>
                    <input
                      type="number"
                      min={1}
                      max={settings[grade].unit === 'hours' ? 999 : 365}
                      value={settings[grade].value}
                      onChange={(e) => setValue(grade, Math.round(Number(e.target.value)))}
                      aria-label={`${label} interval value`}
                    />
                    <select
                      className="settings-unit-select"
                      value={settings[grade].unit}
                      onChange={(e) => setUnit(grade, e.target.value as TimeUnit)}
                      aria-label={`${label} interval unit`}
                    >
                      <option value="hours">hours</option>
                      <option value="days">days</option>
                    </select>
                  </div>
                ))}
              </div>

              <button className="settings-reset" onClick={() => onChange(DEFAULT_SETTINGS)}>
                Reset to defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
