import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { SyncStatus } from '../sync'
import { GoogleIcon, LogOutIcon, UserIcon } from '../icons'

interface Props {
  session: Session | null
  syncStatus: SyncStatus
  onSignIn: () => void
  onSignOut: () => void
}

const STATUS_LABEL: Record<SyncStatus, string> = {
  idle: 'Not synced',
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Sync error',
}

export default function Account({ session, syncStatus, onSignIn, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Position the menu under the avatar, clamped inside the viewport so it can
  // never run off-screen — whatever side the avatar ends up on (portrait,
  // landscape, wrapped header, etc.).
  const place = useCallback(() => {
    const btn = btnRef.current
    const menu = menuRef.current
    if (!btn || !menu) return
    const b = btn.getBoundingClientRect()
    const mw = menu.offsetWidth
    const pad = 8
    const left = Math.max(pad, Math.min(b.right - mw, window.innerWidth - mw - pad))
    setPos({ top: b.bottom + 6, left })
  }, [])

  useLayoutEffect(() => {
    if (open) place()
    else setPos(null)
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReflow = () => place()
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReflow)
    window.addEventListener('scroll', onReflow, true)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReflow)
      window.removeEventListener('scroll', onReflow, true)
    }
  }, [open, place])

  if (!session) {
    return (
      <button className="signin-btn" onClick={onSignIn}>
        <GoogleIcon size={16} />
        Sign in
      </button>
    )
  }

  const meta = session.user.user_metadata ?? {}
  const name: string = meta.full_name ?? meta.name ?? session.user.email ?? 'Account'
  const avatar: string | undefined = meta.avatar_url ?? meta.picture
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="account" ref={ref}>
      <button
        ref={btnRef}
        className="avatar-btn"
        onClick={() => setOpen((o) => !o)}
        title={name}
        aria-label="Account"
      >
        {avatar ? (
          <img className="avatar" src={avatar} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar avatar-fallback">{initial}</span>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          className="account-menu"
          role="menu"
          style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
        >
          <div className="account-head">
            {avatar ? (
              <img className="avatar" src={avatar} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="avatar avatar-fallback">
                <UserIcon size={16} />
              </span>
            )}
            <div className="account-id">
              <div className="account-name">{name}</div>
              {session.user.email && <div className="account-email">{session.user.email}</div>}
            </div>
          </div>

          <div className={`sync-status sync-${syncStatus}`}>
            <span className="sync-dot" />
            {STATUS_LABEL[syncStatus]}
          </div>

          <button className="account-signout" onClick={onSignOut}>
            <LogOutIcon size={15} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
