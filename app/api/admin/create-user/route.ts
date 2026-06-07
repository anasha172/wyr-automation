import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const caller = await createServerSupabaseClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((user.user_metadata?.role ?? 'publisher') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, password, full_name, role } = await req.json()
  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ id: data.user.id })
}
