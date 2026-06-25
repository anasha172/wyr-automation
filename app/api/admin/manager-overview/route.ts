import { NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const caller = await createServerSupabaseClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.user_metadata?.role ?? 'publisher'
  if (!['manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  const [{ data: { users } }, { data: campaigns }, { data: profiles }] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 200 }),
    service.from('campaigns').select('id, theme, stage, user_id, created_at').order('created_at', { ascending: false }),
    service.from('user_profiles').select('id, manager_id, team_id'),
  ])

  // Build a profile map for quick lookup
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))

  // If manager: only show publishers whose manager_id matches this manager
  // If admin: show all publishers
  const isManager = role === 'manager'

  const publishers = (users ?? []).filter(u => {
    if ((u.user_metadata?.role ?? 'publisher') !== 'publisher') return false
    if (isManager) {
      const profile = profileMap[u.id]
      return profile?.manager_id === user.id
    }
    return true
  })

  const publisherIds = new Set(publishers.map(p => p.id))

  const pendingStages    = ['ideas_pending', 'images_pending', 'stories_pending']
  const inProgressStages = ['ideas_approved', 'images_approved', 'stories_approved', 'design_ready']

  const stats = publishers.map(p => {
    const own = (campaigns ?? []).filter(c => c.user_id === p.id)
    return {
      id:          p.id,
      full_name:   p.user_metadata?.full_name ?? '',
      email:       p.email ?? '',
      total:       own.length,
      pending:     own.filter(c => pendingStages.includes(c.stage)).length,
      in_progress: own.filter(c => inProgressStages.includes(c.stage)).length,
      posted:      own.filter(c => c.stage === 'posted').length,
    }
  })

  const queue = (campaigns ?? [])
    .filter(c => pendingStages.includes(c.stage) && publisherIds.has(c.user_id))
    .map(c => {
      const pub = publishers.find(p => p.id === c.user_id)
      return {
        campaign_id:     c.id,
        theme:           c.theme,
        stage:           c.stage,
        created_at:      c.created_at,
        publisher_name:  pub?.user_metadata?.full_name ?? 'Unknown',
        publisher_id:    c.user_id,
      }
    })

  return NextResponse.json({ publishers: stats, queue })
}
