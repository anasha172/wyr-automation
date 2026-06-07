import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export type UserRole = 'publisher' | 'manager' | 'admin'

export interface AppUser {
  id: string
  email: string
  full_name: string
  role: UserRole
}

/**
 * Client-side hook — reads session from the local cookie (no network call).
 * Returns undefined while hydrating, null when signed out, AppUser when authenticated.
 */
export function useUser() {
  const [user, setUser] = useState<AppUser | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()

    function sessionToUser(session: any): AppUser | null {
      const u = session?.user
      if (!u) return null
      const meta = u.user_metadata ?? {}
      return {
        id: u.id,
        email: u.email ?? '',
        full_name: meta.full_name ?? '',
        role: (meta.role ?? 'publisher') as UserRole,
      }
    }

    // getSession() reads the cookie immediately — no network round-trip
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) { setUser(null); return }
      setUser(sessionToUser(session))
    })

    // Keep in sync with sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session))
    })

    return () => subscription.unsubscribe()
  }, [])

  return user
}
