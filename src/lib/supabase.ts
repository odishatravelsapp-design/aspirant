import type { SupabaseClient } from '@supabase/supabase-js'

// Cloud features are OPTIONAL. The app is fully usable offline and anonymously.
// They activate only when these env vars are provided at build time:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isCloudEnabled = Boolean(url && anonKey)

// Lazily import the (heavy) Supabase client only when cloud is enabled, so it
// lands in a separate chunk and never weighs down the default offline build.
let clientPromise: Promise<SupabaseClient> | null = null

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (!isCloudEnabled) return null
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url!, anonKey!, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }),
    )
  }
  return clientPromise
}
