import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const DEMO_EMAILS = [
  'publisher@wyr-demo.com',
  'manager@wyr-demo.com',
  'admin@wyr-demo.com',
]

// GET /api/demo-accounts — returns { email, full_name } for the 3 demo accounts.
// No auth required — called from the login page before the user signs in.
export async function GET() {
  try {
    const service = createServiceClient()
    const { data: { users }, error } = await service.auth.admin.listUsers({ perPage: 200 })
    if (error) return NextResponse.json({}, { status: 500 })

    const map: Record<string, string> = {}
    for (const u of users) {
      if (u.email && DEMO_EMAILS.includes(u.email)) {
        map[u.email] = u.user_metadata?.full_name ?? ''
      }
    }

    return NextResponse.json(map)
  } catch {
    return NextResponse.json({})
  }
}
