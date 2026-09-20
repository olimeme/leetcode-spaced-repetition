import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Config comes from Vite env vars (safe to expose: the anon key is public and
// data is protected by row-level security). When they're absent — e.g. local
// dev before setup — `supabase` is null and the app runs in local-only mode.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

/** True when a backend is configured and cross-device sync is available. */
export const syncEnabled = supabase !== null
