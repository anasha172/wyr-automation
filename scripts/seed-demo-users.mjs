import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tolwxmebbskrzzbdturl.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbHd4bWViYnNrcnp6YmR0dXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUwNDE4OCwiZXhwIjoyMDk2MDgwMTg4fQ.qW6BE4lBKwznDxyWnC7HcrCcz89hYk46MlJ2MwjX3AA'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DEMO_USERS = [
  { email: 'admin@wyr-demo.com',     password: 'demo1234', full_name: 'Alex Admin',       role: 'admin'     },
  { email: 'manager@wyr-demo.com',   password: 'demo1234', full_name: 'Morgan Manager',   role: 'manager'   },
  { email: 'publisher@wyr-demo.com', password: 'demo1234', full_name: 'Pat Publisher',    role: 'publisher' },
]

for (const u of DEMO_USERS) {
  // Create (or get existing) auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.full_name, role: u.role },
  })

  if (error && !error.message.includes('already been registered')) {
    console.error(`❌ ${u.email}:`, error.message)
    continue
  }

  const userId = data?.user?.id
  if (!userId) {
    // User already exists — look up their ID
    const { data: list } = await supabase.auth.admin.listUsers()
    const existing = list?.users?.find(x => x.email === u.email)
    if (!existing) { console.error(`❌ Could not find user ${u.email}`); continue }

    await supabase.from('user_profiles').upsert({ id: existing.id, full_name: u.full_name, role: u.role })
    console.log(`✔  ${u.role.padEnd(10)} ${u.full_name} (${u.email}) — already existed, profile updated`)
    continue
  }

  await supabase.from('user_profiles').upsert({ id: userId, full_name: u.full_name, role: u.role })
  console.log(`✅ ${u.role.padEnd(10)} ${u.full_name} (${u.email}) — created`)
}
