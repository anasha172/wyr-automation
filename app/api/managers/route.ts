import { NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export interface ManagerInfo {
  id:            string
  full_name:     string
  email:         string
  slack_user_id: string | null
}

// GET /api/managers — returns all users with role='manager' only
// Admins manage the system; they do not approve content
// Any authenticated user can call this (publisher needs it to pick a manager)
export async function GET() {
  // Verify caller is authenticated
  const caller = await createServerSupabaseClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Fetch all users with role='manager' (admins don't approve content)
  const { data: { users }, error } = await service.auth.admin.listUsers({ perPage: 200 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const managers = users.filter(u =>
    (u.user_metadata?.role ?? 'publisher') === 'manager'
  )

  if (managers.length === 0) return NextResponse.json([])

  // Fetch their slack_user_id from user_settings
  const managerIds = managers.map(u => u.id)
  const { data: settings } = await service
    .from('user_settings')
    .select('user_id, slack_user_id')
    .in('user_id', managerIds)

  const slackMap: Record<string, string | null> = {}
  settings?.forEach((s: any) => { slackMap[s.user_id] = s.slack_user_id ?? null })

  const result: ManagerInfo[] = managers.map(u => ({
    id:            u.id,
    full_name:     u.user_metadata?.full_name ?? u.email ?? 'Manager',
    email:         u.email ?? '',
    slack_user_id: slackMap[u.id] ?? null,
  }))

  return NextResponse.json(result)
}
