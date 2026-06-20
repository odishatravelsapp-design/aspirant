import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabase, isCloudEnabled } from '../lib/supabase'
import { syncAttempts } from '../lib/sync'

interface AuthState {
  enabled: boolean
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

// Optional Google auth. When cloud is disabled this is a harmless no-op so the
// rest of the app never needs to branch on configuration.
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(isCloudEnabled)

  useEffect(() => {
    if (!isCloudEnabled) return
    let unsub: (() => void) | undefined
    void (async () => {
      const supabase = await getSupabase()
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
      setLoading(false)
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        // On sign-in, back up and merge attempts across devices.
        if (u) void syncAttempts(u.id)
      })
      unsub = () => sub.subscription.unsubscribe()
    })()
    return () => unsub?.()
  }, [])

  async function signInWithGoogle() {
    const supabase = await getSupabase()
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
  }

  async function signOut() {
    const supabase = await getSupabase()
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { enabled: isCloudEnabled, user, loading, signInWithGoogle, signOut }
}
