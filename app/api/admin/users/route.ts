import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

async function requireAdmin() {
  const caller = await createServerSupabaseClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return null
  if ((user.user_metadata?.role ?? 'publisher') !== 'admin') return null
  return user
}

// GET /api/admin/users — list all users
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { data: { users }, error } = await service.auth.admin.listUsers({ perPage: 200 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch slack_user_ids from user_settings for managers/admins
  const managerIds = users
    .filter(u => ['manager', 'admin'].includes(u.user_metadata?.role ?? 'publisher'))
    .map(u => u.id)

  let slackMap: Record<string, string | null> = {}
  if (managerIds.length > 0) {
    const { data: settings } = await service
      .from('user_settings')
      .select('user_id, slack_user_id')
      .in('user_id', managerIds)
    settings?.forEach((s: any) => { slackMap[s.user_id] = s.slack_user_id ?? null })
  }

  const list = users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    full_name: u.user_metadata?.full_name ?? '',
    role: u.user_metadata?.role ?? 'publisher',
    created_at: u.created_at,
    slack_user_id: slackMap[u.id] ?? null,
  }))

  return NextResponse.json(list)
}

// PATCH /api/admin/users  { id, full_name?, role?, slack_user_id?, password? }
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, full_name, role, slack_user_id, password } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()

  // Update user metadata (name/role)
  if (full_name !== undefined || role) {
    const { data: existing } = await service.auth.admin.getUserById(id)
    const merged = { ...existing?.user?.user_metadata, ...(full_name !== undefined ? { full_name } : {}), ...(role ? { role } : {}) }
    const { error } = await service.auth.admin.updateUserById(id, { user_metadata: merged })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Update slack_user_id in user_settings
  if (slack_user_id !== undefined) {
    const { error } = await service
      .from('user_settings')
      .upsert({ user_id: id, slack_user_id: slack_user_id || null }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Change password
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
