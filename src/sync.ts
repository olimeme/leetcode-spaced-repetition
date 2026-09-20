import type { Problem, SrsSettings } from './types'
import { supabase } from './supabase'

/** The whole board synced as one row, last-write-wins by `updatedAt`. */
export interface Board {
  problems: Problem[]
  settings: SrsSettings
  activity: string[]
  updatedAt: string
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

const TABLE = 'boards'

/** Read the signed-in user's board, or null if they have none yet. */
export async function fetchBoard(userId: string): Promise<Board | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.data as Board) ?? null
}

/** Upsert the signed-in user's board. */
export async function pushBoard(userId: string, board: Board): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: board, updated_at: board.updatedAt })
  if (error) throw error
}
