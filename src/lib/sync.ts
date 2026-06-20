import { getSupabase } from './supabase'
import { getAttempts, mergeAttempts } from './storage'
import type { Attempt } from '../types'

// Two-way sync of test attempts with Supabase. Local storage stays the source of
// truth for offline use; the cloud is just a backup/cross-device copy.
//
// Table `attempts`: columns (id text PK, user_id uuid, finished_at int8, data jsonb).
// Row Level Security ensures each user only sees their own rows (see supabase/schema.sql).

export async function pushAttempts(userId: string): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return
  const local = getAttempts()
  if (local.length === 0) return
  const rows = local.map((a) => ({
    id: a.id,
    user_id: userId,
    finished_at: a.finishedAt,
    data: a as unknown as Record<string, unknown>,
  }))
  // Upsert by primary key so re-syncing is idempotent.
  await supabase.from('attempts').upsert(rows, { onConflict: 'id' })
}

export async function pullAttempts(): Promise<Attempt[]> {
  const supabase = await getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase.from('attempts').select('data').limit(500)
  if (error || !data) return []
  const remote = data.map((r) => (r as { data: Attempt }).data).filter(Boolean)
  return mergeAttempts(remote)
}

// Full sync: push local up, then pull merged set back down.
export async function syncAttempts(userId: string): Promise<void> {
  await pushAttempts(userId)
  await pullAttempts()
}
