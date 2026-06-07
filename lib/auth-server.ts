import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { AppUser } from '@/lib/auth'

/** Server-side: get current user from auth metadata. Returns null if unauthenticated. */
export async function getServerUser(): Promise<AppUser | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: meta.full_name ?? '',
    role: (meta.role ?? 'publisher') as AppUser['role'],
  }
}
