import { useEffect, useRef, useState } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

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
        <div className="account-menu" role="menu">
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
