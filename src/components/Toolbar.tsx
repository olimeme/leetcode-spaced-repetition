import { useRef } from 'react'
import type { Problem } from '../types'
import { exportCSV, exportJSON, parseImportedJSON } from '../io'
import { DownloadIcon, UploadIcon } from '../icons'

interface Props {
  problems: Problem[]
  onImport: (imported: Problem[]) => void
}

export default function Toolbar({ problems, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const imported = parseImportedJSON(text)
      onImport(imported)
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`)
    } finally {
      e.target.value = '' // allow re-importing the same file
    }
  }

  return (
    <div className="toolbar">
      <button className="tool" onClick={() => exportJSON(problems)} disabled={!problems.length}>
        <DownloadIcon />
        Export JSON
      </button>
      <button className="tool" onClick={() => exportCSV(problems)} disabled={!problems.length}>
        <DownloadIcon />
        Export CSV
      </button>
      <button className="tool" onClick={() => fileRef.current?.click()}>
        <UploadIcon />
        Import JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        hidden
      />
    </div>
  )
}
