import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

async function requireAdmin() {
  const caller = await createServerSupabaseClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return null
  if ((user.user_metadata?.role ?? 'publisher') !== 'admin') return null
  return user
}

// GET /api/admin/users — list all users with team / manager / slack info
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()

  const [
    { data: { users }, error: authErr },
    { data: profiles },
    { data: teamsData },
  ] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 200 }),
    service.from('user_profiles').select('id, team_id, manager_id, slack_user_id'),
    service.from('teams').select('id, name'),
  ])

  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))
  const teamMap    = Object.fromEntries((teamsData  ?? []).map((t: any) => [t.id, t.name]))

  const list = users.map(u => {
    const profile = profileMap[u.id] ?? {}
    return {
      id:           u.id,
      email:        u.email ?? '',
      full_name:    u.user_metadata?.full_name ?? '',
      role:         u.user_metadata?.role ?? 'publisher',
      created_at:   u.created_at,
      team_id:      profile.team_id      ?? null,
      team_name:    profile.team_id ? (teamMap[profile.team_id] ?? null) : null,
      manager_id:   profile.manager_id   ?? null,
      slack_user_id: profile.slack_user_id ?? null,
    }
  })

  return NextResponse.json(list)
}

// PATCH /api/admin/users
// Body: { id, full_name?, role?, slack_user_id?, team_id?, manager_id?, password? }
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, full_name, role, slack_user_id, team_id, manager_id, password } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()

  // 1. Update auth metadata (name / role)
  if (full_name !== undefined || role !== undefined) {
    const { data: existing } = await service.auth.admin.getUserById(id)
    const merged = {
      ...existing?.user?.user_metadata,
      ...(full_name !== undefined ? { full_name } : {}),
      ...(role      !== undefined ? { role }      : {}),
    }
    const { error } = await service.auth.admin.updateUserById(id, { user_metadata: merged })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // 2. Update user_profiles (team / manager / slack)
  const profileUpdates: Record<string, unknown> = {}
  if (slack_user_id !== undefined) profileUpdates.slack_user_id = slack_user_id || null
  if (team_id       !== undefined) profileUpdates.team_id       = team_id       || null
  if (manager_id    !== undefined) profileUpdates.manager_id    = manager_id    || null

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await service
      .from('user_profiles')
      .upsert({ id, ...profileUpdates }, { onConflict: 'id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // 3. Change password
  if (password !== undefined) {
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    const { error } = await service.auth.admin.updateUserById(id, { password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/users?id=xxx
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === admin.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
