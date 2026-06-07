import { NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

async function requireAdmin() {
  const caller = await createServerSupabaseClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return null
  if ((user.user_metadata?.role ?? 'publisher') !== 'admin') return null
  return user
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()

  // ── Users ──────────────────────────────────────────────────────
  const { data: { users: allUsers } } = await service.auth.admin.listUsers({ perPage: 200 })
  const usersByRole = { publisher: 0, manager: 0, admin: 0 }
  allUsers.forEach(u => {
    const r = (u.user_metadata?.role ?? 'publisher') as keyof typeof usersByRole
    if (r in usersByRole) usersByRole[r]++
  })

  const managerIds = allUsers.filter(u => u.user_metadata?.role === 'manager').map(u => u.id)
  const { data: slackSettings } = await service
    .from('user_settings').select('user_id, slack_user_id').in('user_id', managerIds)
  const managersWithSlack = slackSettings?.filter(s => s.slack_user_id).length ?? 0

  // ── Campaigns ──────────────────────────────────────────────────
  const { data: campaigns } = await service.from('campaigns').select('stage, created_at')
  const campaignsByStage: Record<string, number> = {}
  campaigns?.forEach(c => { campaignsByStage[c.stage] = (campaignsByStage[c.stage] ?? 0) + 1 })

  // ── Ideas ──────────────────────────────────────────────────────
  const { data: ideas } = await service.from('wyr_ideas').select('approval_status, created_at')
  const ideasByStatus: Record<string, number> = {}
  ideas?.forEach(i => { ideasByStatus[i.approval_status] = (ideasByStatus[i.approval_status] ?? 0) + 1 })

  // ── Images ─────────────────────────────────────────────────────
  const { count: imageCount } = await service.from('wyr_images').select('id', { count: 'exact', head: true })

  // ── Approval tokens ────────────────────────────────────────────
  const { data: tokens } = await service.from('approval_tokens').select('used, expires_at, approval_type, created_at').order('created_at', { ascending: false })
  const tokenStats = {
    total:   tokens?.length ?? 0,
    used:    tokens?.filter(t => t.used).length ?? 0,
    expired: tokens?.filter(t => !t.used && new Date(t.expires_at) < new Date()).length ?? 0,
    active:  tokens?.filter(t => !t.used && new Date(t.expires_at) >= new Date()).length ?? 0,
    recent:  tokens?.slice(0, 5) ?? [],
  }

  // ── Posts (published) ──────────────────────────────────────────
  const { count: postCount } = await service.from('posts').select('id', { count: 'exact', head: true })

  // ── AI / OpenRouter usage ──────────────────────────────────────
  let aiCredits: { label: string; remaining: number | null; limit: number | null } = {
    label: 'anthropic/claude-sonnet-4-5', remaining: null, limit: null,
  }
  try {
    const r = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    })
    if (r.ok) {
      const d = await r.json()
      aiCredits = {
        label:     d.data?.label ?? 'anthropic/claude-sonnet-4-5',
        remaining: d.data?.limit_remaining ?? null,
        limit:     d.data?.limit ?? null,
      }
    }
  } catch {}

  // Ideas generated = campaigns × 5 (rough: actual generations tracked via campaign count)
  const totalGenerations = campaigns?.length ?? 0
  const estimatedTokensUsed = totalGenerations * 1500 + (ideas?.length ?? 0) * 400 // rough estimate

  // ── Global settings (env health) ──────────────────────────────
  const globalSettings = {
    openrouter:     !!(process.env.OPENROUTER_API_KEY),
    supabase:       !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    slack_bot:      !!(process.env.SLACK_BOT_TOKEN),
    slack_webhook:  !!(process.env.SLACK_WEBHOOK_URL),
    resend:         !!(process.env.RESEND_API_KEY),
    google_search:  !!(process.env.GOOGLE_API_KEY),
    unsplash:       !!(process.env.UNSPLASH_ACCESS_KEY),
    instagram:      !!(process.env.INSTAGRAM_USER_ID && process.env.INSTAGRAM_USER_ACCESS_TOKEN),
  }

  return NextResponse.json({
    users: {
      total: allUsers.length,
      byRole: usersByRole,
      managersWithSlack,
      managersTotal: managerIds.length,
    },
    campaigns: {
      total:    campaigns?.length ?? 0,
      byStage:  campaignsByStage,
    },
    ideas: {
      total:    ideas?.length ?? 0,
      byStatus: ideasByStatus,
    },
    images: {
      total: imageCount ?? 0,
    },
    posts: {
      total: postCount ?? 0,
    },
    tokens: tokenStats,
    ai: {
      model:              'claude-sonnet-4-5',
      provider:           'OpenRouter',
      totalGenerations,
      estimatedTokensUsed,
      credits:            aiCredits,
    },
    db: {
      tables: [
        { name: 'campaigns',       rows: campaigns?.length ?? 0 },
        { name: 'wyr_ideas',       rows: ideas?.length ?? 0 },
        { name: 'wyr_images',      rows: imageCount ?? 0 },
        { name: 'posts',           rows: postCount ?? 0 },
        { name: 'approval_tokens', rows: tokenStats.total },
        { name: 'user_settings',   rows: allUsers.length },
      ],
    },
    globalSettings,
    generatedAt: new Date().toISOString(),
  })
}
