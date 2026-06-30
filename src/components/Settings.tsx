import { useEffect, useRef, useState } from 'react'
import type { Grade, Problem, SrsSettings, TimeUnit } from '../types'
import { DEFAULT_SETTINGS } from '../srs'
import { exportBackup, parseBackup, type Backup } from '../backup'
import { CloseIcon, DownloadIcon, GearIcon, UploadIcon } from '../icons'

interface Props {
  settings: SrsSettings
  onChange: (settings: SrsSettings) => void
  problems: Problem[]
  onImport: (backup: Backup) => void
}

const ROWS: { grade: Grade; label: string; cls: string }[] = [
  { grade: 'easy', label: 'Easy', cls: 'g-easy' },
  { grade: 'medium', label: 'Medium', cls: 'g-medium' },
  { grade: 'hard', label: 'Hard', cls: 'g-hard' },
]

export default function Settings({ settings, onChange, problems, onImport }: Props) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const backup = parseBackup(await file.text())
      onImport(backup)
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`)
    } finally {
      e.target.value = '' // allow re-importing the same file
    }
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

              <div className="settings-section">
                <h3>Backup</h3>
                <p className="settings-hint">
                  Your data lives only in this browser. Export a file to back it up or move it
                  to another device; importing merges problems by link.
                </p>
                <div className="settings-backup">
                  <button
                    className="settings-btn"
                    onClick={() => exportBackup(problems, settings)}
                    disabled={problems.length === 0}
                  >
                    <DownloadIcon size={14} />
                    Export backup
                  </button>
                  <button className="settings-btn" onClick={() => fileRef.current?.click()}>
                    <UploadIcon size={14} />
                    Import backup
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleFile}
                    hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
