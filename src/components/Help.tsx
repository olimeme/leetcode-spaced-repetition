import { useEffect, useState } from 'react'
import { CloseIcon, HelpIcon } from '../icons'

export default function Help() {
  const [open, setOpen] = useState(false)

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button className="help-btn" onClick={() => setOpen(true)}>
        <HelpIcon size={15} />
        How it works
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="How it works"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>How it works</h2>
              <button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                A spaced-repetition board for LeetCode. You revisit problems on a schedule
                that stretches out the better you know them — so practice sticks without
                re-grinding everything every day.
              </p>

              <h3>1. Add problems</h3>
              <p>
                Paste one or more LeetCode problem links into the box and hit{' '}
                <strong>Add to backlog</strong> (or <kbd>⌘/Ctrl</kbd> + <kbd>Enter</kbd>). The
                title, difficulty, and topic tags are fetched from LeetCode automatically.
              </p>

              <h3>2. The board</h3>
              <ul>
                <li>
                  <strong>Backlog</strong> — problems you've added but not started.
                </li>
                <li>
                  <strong>For Today</strong> — due for a revisit right now.
                </li>
                <li>
                  <strong>Upcoming</strong> — scheduled, not due yet.
                </li>
                <li>
                  <strong>Solved Today</strong> — graded today, with days until the next
                  revisit.
                </li>
              </ul>

              <h3>3. Solve &amp; grade</h3>
              <p>
                After solving a problem, click <strong>Easy</strong>, <strong>Medium</strong>,
                or <strong>Hard</strong>. The harder it felt, the sooner it returns — Hard
                comes back tomorrow, Medium in a few days, Easy further out each time you nail
                it.
              </p>

              <h3>4. Handy extras</h3>
              <ul>
                <li>
                  <strong>I forgot it</strong> — sends a problem straight back to For Today.
                </li>
                <li>
                  <strong>Drag</strong> cards between columns to move them by hand.
                </li>
                <li>
                  Filter by <strong>topic</strong> using the chips above the board.
                </li>
                <li>
                  <kbd>⌘/Ctrl</kbd> + <kbd>Z</kbd> to undo, <kbd>⌘/Ctrl</kbd> +{' '}
                  <kbd>Shift</kbd> + <kbd>Z</kbd> to redo.
                </li>
              </ul>

              <p className="modal-note">
                Everything is saved locally in your browser — no account needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
