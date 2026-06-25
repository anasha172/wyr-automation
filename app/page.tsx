'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Clock, CheckCircle2, Search, Plus, ChevronRight, Sparkles, Briefcase, Send, CalendarDays } from 'lucide-react'
import { InstagramIcon } from '@/components/icons'
import { LinkedInIcon } from '@/components/linkedin/linkedin-icon'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { useUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { StagePill } from '@/components/stage-pill'
import { formatDateShort } from '@/lib/utils'
import { AdminDashboard } from '@/components/admin-dashboard'

// ─── Types & constants ────────────────────────────────────────────────────────

interface Campaign {
  id: string
  theme: string
  stage: string
  created_at: string
  tone: string
  audience: string
}

type FilterTab   = 'all' | 'approval' | 'in_progress' | 'posted'
type ChannelTab  = 'all' | 'instagram' | 'linkedin'

const STAGE_NEXT: Record<string, string> = {
  ideas_pending:   'ideas',   ideas_approved:   'images',
  images_pending:  'images',  images_approved:  'design',
  stories_pending: 'design',  stories_approved: 'publish',
  design_ready:    'publish', posted:           'publish',
}

/*
  Pipeline step index (0-based cursor into 5 segments):
  Theme=0, Ideas=1, Images=2, Stories=3, Posted=4 → "done" means i < cur
*/
const STAGE_TO_STEP: Record<string, number> = {
  ideas_pending:    1, ideas_approved:    2,
  images_pending:   2, images_approved:   3,
  stories_pending:  3, stories_approved:  4,
  design_ready:     4, posted:            5,
}

function audienceLabel(s: string) {
  if (!s) return ''
  if (s === 'gen-z') return 'Gen Z'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── MiniPipe — 5-segment progress bar ───────────────────────────────────────

function MiniPipe({ stage }: { stage: string }) {
  const cur = STAGE_TO_STEP[stage] ?? 0
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            width:        22,
            height:       4,
            borderRadius: 2,
            background:
              i < cur  ? 'var(--ink)' :
              i === cur ? 'var(--a)'  :
              'var(--hair-2)',
            transition: 'background .2s',
          }}
        />
      ))}
    </div>
  )
}

// ─── Section label (INSTAGRAM / LINKEDIN eyebrow) ────────────────────────────

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           8,
        fontFamily:    'var(--mono)',
        fontSize:      10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color:         'var(--ink-3)',
        marginBottom:  10,
      }}
    >
      <span style={{ display: 'flex', color: 'var(--ink-3)' }}>{icon}</span>
      {children}
      <span style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
    </div>
  )
}

// ─── Figure (stat card) ───────────────────────────────────────────────────────

function Figure({
  label, value, display, trend, up, icon, last = false,
}: {
  label:    string
  value:    number
  display?: string   // optional override for the big number (e.g. "—")
  trend:    string
  up:       boolean
  icon:     React.ReactNode
  last?:    boolean
}) {
  return (
    <div style={{ padding: '20px 22px', borderRight: last ? 'none' : '1px solid var(--hair)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
          }}
        >
          {label}
        </span>
        <span style={{ color: 'var(--ink-3)' }}>{icon}</span>
      </div>

      {/* Big serif number */}
      <div
        style={{
          fontFamily:    'var(--serif)',
          fontSize:      44,
          fontWeight:    500,
          lineHeight:    1,
          marginTop:     10,
          letterSpacing: '-0.02em',
          color:         'var(--ink)',
        }}
      >
        {display ?? value}
      </div>

      {/* Trend line */}
      <div
        style={{
          fontSize:    12.5,
          color:       up ? 'var(--go-ink)' : 'var(--ink-3)',
          marginTop:   8,
          display:     'flex',
          alignItems:  'center',
          gap:         5,
        }}
      >
        {trend}
      </div>
    </div>
  )
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const user   = useUser()

  const [campaigns,         setCampaigns]         = useState<Campaign[]>([])
  const [loading,           setLoading]           = useState(true)
  const [filter,            setFilter]            = useState<FilterTab>('all')
  const [channel,           setChannel]           = useState<ChannelTab>('all')
  const [search,            setSearch]            = useState('')
  const [page,              setPage]              = useState(1)
  const [linkedinJobsReady, setLinkedinJobsReady] = useState<number | null>(null)
  const [linkedinPosts,     setLinkedinPosts]     = useState<any[]>([])

  const PAGE_SIZE = 10

  // ── Data loading ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return   // wait for auth to resolve

    if (isDemoMode) {
      setCampaigns(demoStore.campaigns.getAll())
      setLoading(false)
      return
    }

    const supabase = createClient()
    const isMgr    = user.role === 'manager'

    async function load() {
      if (isMgr) {
        // RLS policy (schema_patch_v5) automatically scopes campaigns to
        // publishers whose manager_id = auth.uid() — no manual filter needed.
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false })

        setCampaigns(data ?? [])
      } else {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })

        setCampaigns(data ?? [])
      }
      setLoading(false)
    }

    load()

    // Realtime: keep stats + stage pills up-to-date without a page reload
    const channel = supabase
      .channel('dashboard-campaigns')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns' },
        payload => {
          if (payload.eventType === 'INSERT') {
            // Only add to list if it belongs to the current user (publisher) or is a manager assignment
            if (!isMgr && (payload.new as any).user_id === user!.id) {
              setCampaigns(prev => [payload.new as Campaign, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            setCampaigns(prev =>
              prev.map(c => c.id === (payload.new as Campaign).id ? { ...c, ...(payload.new as Campaign) } : c)
            )
          } else if (payload.eventType === 'DELETE') {
            setCampaigns(prev => prev.filter(c => c.id !== (payload.old as any).id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  // ── LinkedIn jobs count + post history ──────────────────────
  useEffect(() => {
    fetch('/api/linkedin/fetch-jobs')
      .then(r => r.json())
      .then(d => setLinkedinJobsReady(d.jobs?.length ?? 0))
      .catch(() => setLinkedinJobsReady(0))

    fetch('/api/linkedin/posts')
      .then(r => r.ok ? r.json() : [])
      .then(d => setLinkedinPosts(Array.isArray(d) ? d : []))
      .catch(() => setLinkedinPosts([]))
  }, [])

  // ── Stats ────────────────────────────────────────────────────
  const startOfWeek = Date.now() - 7 * 24 * 60 * 60 * 1000

  const total           = campaigns.length
  const createdThisWeek = campaigns.filter(c => new Date(c.created_at).getTime() >= startOfWeek).length
  const pendingApprovals = campaigns.filter(c =>
    ['ideas_pending','images_pending','stories_pending'].includes(c.stage)
  ).length
  const inProgress      = campaigns.filter(c =>
    ['ideas_approved','images_approved','stories_approved','design_ready'].includes(c.stage)
  ).length
  const totalPosted     = campaigns.filter(c => c.stage === 'posted').length

  // ── Filtering ────────────────────────────────────────────────
  const filtered = campaigns.filter(c => {
    const matchesFilter =
      filter === 'approval'    ? ['ideas_pending','images_pending','stories_pending'].includes(c.stage) :
      filter === 'in_progress' ? ['ideas_approved','images_approved','stories_approved','design_ready'].includes(c.stage) :
      filter === 'posted'      ? c.stage === 'posted' : true
    // channel filter: instagram = all campaigns; linkedin tab has its own data source
    const matchesChannel = channel === 'linkedin' ? false : true
    return matchesFilter && matchesChannel && (!search || c.theme.toLowerCase().includes(search.toLowerCase()))
  })

  // ── Pagination ───────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function goTo(p: number) { setPage(Math.max(1, Math.min(p, totalPages))) }

  // Reset to page 1 when filter, channel or search changes
  useEffect(() => { setPage(1) }, [filter, channel, search])

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'approval',    label: 'Awaiting Approval', count: pendingApprovals },
    { key: 'in_progress', label: 'In Progress',       count: inProgress     },
    { key: 'posted',      label: 'Posted',            count: totalPosted    },
  ]

  // ── Admin gets system dashboard ─────────────────────────────
  if (user?.role === 'admin') return <AdminDashboard />

  // ── Render (publisher / manager) ────────────────────────────
  return (
    <div style={{ padding: '28px 40px 80px' }}>

      {/* ── Masthead ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>

        {/* Left: eyebrow → title → lede */}
        <div>
          <span
            style={{
              display:       'block',
              fontFamily:    'var(--mono)',
              fontSize:      11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'var(--ink-3)',
              marginBottom:  12,
            }}
          >
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>01</span>
            {'  '}The desk
          </span>

          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontWeight:    500,
              fontSize:      46,
              letterSpacing: '-0.025em',
              lineHeight:    1.0,
              color:         'var(--ink)',
              margin:        0,
            }}
          >
            Dashboard
          </h1>

          <p style={{ color: 'var(--ink-2)', fontSize: 15.5, marginTop: 12, maxWidth: '56ch', margin: '12px 0 0' }}>
            Instagram campaigns and LinkedIn posts, all in one place.
          </p>
        </div>

        {/* Right: search + CTA */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position:  'absolute',
                left:      12,
                top:       '50%',
                transform: 'translateY(-50%)',
                color:     'var(--ink-3)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search themes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft:   34,
                paddingRight:  14,
                paddingTop:    10,
                paddingBottom: 10,
                fontSize:      14,
                color:         'var(--ink)',
                fontFamily:    'var(--sans)',
                background:    'var(--card)',
                border:        '1px solid var(--hair-2)',
                borderRadius:  10,
                outline:       'none',
                width:         220,
                transition:    'border-color .14s, box-shadow .14s',
              }}
              onFocus={e => {
                const el = e.target as HTMLInputElement
                el.style.borderColor = 'var(--ink)'
                el.style.boxShadow   = '0 0 0 3px color-mix(in oklab, var(--ink) 8%, transparent)'
              }}
              onBlur={e => {
                const el = e.target as HTMLInputElement
                el.style.borderColor = 'var(--hair-2)'
                el.style.boxShadow   = 'none'
              }}
            />
          </div>

        </div>
      </div>

      {/* Demo mode notice */}
      {isDemoMode && (
        <div
          style={{
            marginBottom: 20,
            padding:      '7px 14px',
            background:   'var(--paper-2)',
            border:       '1px solid var(--hair)',
            borderRadius: 8,
          }}
        >
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
            Demo mode — data stored in browser
          </span>
        </div>
      )}

      {/* ── Instagram stats ───────────────────────────────────── */}
      <SectionLabel icon={<InstagramIcon size={12} />}>Instagram</SectionLabel>
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          border:              '1px solid var(--hair)',
          borderRadius:        14,
          overflow:            'hidden',
          background:          'var(--card)',
          marginBottom:        26,
        }}
      >
        <Figure
          label="Total Campaigns"
          value={total}
          trend={createdThisWeek > 0 ? `+${createdThisWeek} this week` : 'No new this week'}
          up={createdThisWeek > 0}
          icon={<TrendingUp size={16} />}
        />
        <Figure
          label="Pending Approval"
          value={pendingApprovals}
          trend={
            pendingApprovals > 0 ? `${pendingApprovals} awaiting manager` :
            inProgress > 0       ? `${inProgress} in progress` :
            'All clear'
          }
          up={false}
          icon={<Clock size={16} />}
        />
        <Figure
          label="Posted This Week"
          value={totalPosted}
          trend={`${totalPosted} live on Instagram`}
          up={totalPosted > 0}
          icon={<CheckCircle2 size={16} />}
          last
        />
      </div>

      {/* ── LinkedIn stats ────────────────────────────────────── */}
      <SectionLabel icon={<LinkedInIcon size={12} />}>LinkedIn</SectionLabel>
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          border:              '1px solid var(--hair)',
          borderRadius:        14,
          overflow:            'hidden',
          background:          'var(--card)',
          marginBottom:        26,
        }}
      >
        <Figure
          label="Jobs Ready to Post"
          value={linkedinJobsReady ?? 0}
          trend={linkedinJobsReady ? 'Not posted yet' : 'No jobs pending'}
          up={!!linkedinJobsReady}
          icon={<Briefcase size={16} />}
        />
        <Figure
          label="Carousels Posted"
          value={linkedinPosts.length}
          trend={linkedinPosts.length > 0 ? `${linkedinPosts.reduce((s, p) => s + (p.jobs?.length ?? 0), 0)} jobs total` : 'No posts yet'}
          up={linkedinPosts.length > 0}
          icon={<Send size={16} />}
        />
        <Figure
          label="Last Post"
          value={0}
          display={linkedinPosts[0] ? new Date(linkedinPosts[0].posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
          trend={linkedinPosts[0] ? `${linkedinPosts[0].jobs?.length ?? 0} jobs · ${linkedinPosts[0].target}` : 'Never posted'}
          up={!!linkedinPosts[0]}
          icon={<CalendarDays size={16} />}
          last
        />
      </div>

      {/* ── Campaigns card ────────────────────────────────────── */}
      <div
        style={{
          background:   'var(--card)',
          border:       '1px solid var(--hair)',
          borderRadius: 14,
          boxShadow:    'var(--shadow-sm)',
          overflow:     'hidden',
        }}
      >

        {/* Tab bar */}
        <div
          style={{
            display:      'flex',
            flexDirection:'column',
            borderBottom: '1px solid var(--hair)',
          }}
        >
          {/* Channel tabs row */}
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          2,
              padding:      '10px 18px 0',
              borderBottom: '1px solid var(--hair)',
            }}
          >
            {([
              { key: 'all',       label: 'All' },
              { key: 'instagram', label: 'Instagram', icon: <InstagramIcon size={12} /> },
              { key: 'linkedin',  label: 'LinkedIn',  icon: <LinkedInIcon size={12} /> },
            ] as { key: ChannelTab; label: string; icon?: React.ReactNode }[]).map(t => {
              const active = channel === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setChannel(t.key)}
                  style={{
                    fontFamily:    'var(--mono)',
                    fontSize:      11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color:         active ? 'var(--ink)' : 'var(--ink-3)',
                    padding:       '8px 14px 10px',
                    borderRadius:  0,
                    cursor:        'pointer',
                    border:        'none',
                    borderBottom:  active ? '2px solid var(--ink)' : '2px solid transparent',
                    background:    'transparent',
                    display:       'flex',
                    alignItems:    'center',
                    gap:           6,
                    transition:    'all .14s',
                    lineHeight:    1,
                    marginBottom:  -1,
                  }}
                >
                  {t.icon && <span style={{ display: 'flex' }}>{t.icon}</span>}
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Stage filter + pagination row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {TABS.map(t => {
              const active = filter === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  style={{
                    fontFamily:   'var(--sans)',
                    fontWeight:   600,
                    fontSize:     13.5,
                    color:        active ? 'var(--ink)' : 'var(--ink-3)',
                    padding:      '8px 14px',
                    borderRadius: 8,
                    cursor:       'pointer',
                    border:       active ? '1px solid var(--hair)' : '1px solid transparent',
                    background:   active ? 'var(--card)' : 'transparent',
                    boxShadow:    active ? 'var(--shadow-sm)' : 'none',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          8,
                    transition:   'all .14s',
                    lineHeight:   1,
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Range label + pagination controls (right side of header) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
              {filtered.length === 0
                ? '0 campaigns'
                : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Prev */}
              <button
                onClick={() => goTo(safePage - 1)}
                disabled={safePage === 1}
                style={{
                  width:          32, height: 32, borderRadius: 8,
                  border:         '1px solid var(--hair-2)',
                  background:     'transparent',
                  cursor:         safePage === 1 ? 'default' : 'pointer',
                  opacity:        safePage === 1 ? 0.35 : 1,
                  display:        'flex', alignItems: 'center', justifyContent: 'center',
                  color:          'var(--ink-2)', transition: 'all .12s',
                }}
                onMouseEnter={e => { if (safePage !== 1) (e.currentTarget.style.background = 'var(--paper-2)') }}
                onMouseLeave={e => { (e.currentTarget.style.background = 'transparent') }}
              >
                <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
              </button>

              {/* Page pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                const active = p === safePage
                return (
                  <button
                    key={p}
                    onClick={() => goTo(p)}
                    style={{
                      minWidth: 32, height: 32, borderRadius: 8,
                      border:      active ? '1px solid var(--ink)' : '1px solid transparent',
                      background:  active ? 'var(--ink)' : 'transparent',
                      color:       active ? 'var(--paper)' : 'var(--ink-2)',
                      fontFamily:  'var(--mono)', fontSize: 12,
                      fontWeight:  active ? 700 : 400,
                      cursor:      'pointer', transition: 'all .12s', padding: '0 6px',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget.style.background = 'var(--paper-2)') }}
                    onMouseLeave={e => { if (!active) (e.currentTarget.style.background = 'transparent') }}
                  >
                    {p}
                  </button>
                )
              })}

              {/* Next */}
              <button
                onClick={() => goTo(safePage + 1)}
                disabled={safePage === totalPages}
                style={{
                  width:          32, height: 32, borderRadius: 8,
                  border:         '1px solid var(--hair-2)',
                  background:     'transparent',
                  cursor:         safePage === totalPages ? 'default' : 'pointer',
                  opacity:        safePage === totalPages ? 0.35 : 1,
                  display:        'flex', alignItems: 'center', justifyContent: 'center',
                  color:          'var(--ink-2)', transition: 'all .12s',
                }}
                onMouseEnter={e => { if (safePage !== totalPages) (e.currentTarget.style.background = 'var(--paper-2)') }}
                onMouseLeave={e => { (e.currentTarget.style.background = 'transparent') }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          </div>
          </div> {/* end stage filter + pagination row */}
        </div>

        {/* Table / empty / loading */}
        {channel === 'linkedin' ? (
          linkedinPosts.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center' }}>
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center', color: 'var(--ink-3)' }}>
                <LinkedInIcon size={26} />
              </div>
              <p style={{ fontWeight: 500, color: 'var(--ink-2)', marginBottom: 6 }}>No LinkedIn posts yet</p>
              <p style={{ color: 'var(--ink-3)', fontSize: 13.5, marginBottom: 18 }}>
                Posts you publish via LinkedIn · New Post will appear here.
              </p>
              <Link href="/linkedin/new">
                <Button variant="ink" size="sm">
                  <Plus size={13} /> New LinkedIn Post
                </Button>
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Companies', 'Jobs', 'Slides', 'Target', 'Posted', ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign:     i === 5 ? 'right' : 'left',
                        fontFamily:    'var(--mono)',
                        fontSize:      10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color:         'var(--ink-3)',
                        fontWeight:    400,
                        padding:       '12px 16px',
                        borderBottom:  '1px solid var(--hair)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linkedinPosts.map((p, i) => {
                  const companies: string = (p.jobs as any[])
                    .map((j: any) => j.company).filter(Boolean)
                    .filter((c: string, idx: number, arr: string[]) => arr.indexOf(c) === idx)
                    .join(', ')
                  const isLast = i === linkedinPosts.length - 1
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: isLast ? 'none' : '1px solid var(--hair)', transition: 'background .12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '13px 16px', fontWeight: 500, fontSize: 14, color: 'var(--ink)', maxWidth: 280 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {companies || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-2)' }}>
                          {(p.jobs as any[]).length}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-2)' }}>
                          {p.slide_count}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em',
                          textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5,
                          background: 'var(--paper-2)', border: '1px solid var(--hair-2)', color: 'var(--ink-3)',
                        }}>
                          {p.target}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                          {new Date(p.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        {p.post_url && (
                          <a
                            href={p.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--b-ink)', textDecoration: 'none' }}
                          >
                            <LinkedInIcon size={11} /> View
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        ) : loading ? (
          <div style={{ padding: '24px 20px' }}>
            {[1, 0.65, 0.4].map((op, i) => (
              <div
                key={i}
                style={{
                  height:       52,
                  background:   'var(--paper-2)',
                  borderRadius: 8,
                  marginBottom: 8,
                  opacity:      op,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center', color: 'var(--ink-3)' }}>
              <Sparkles size={26} />
            </div>
            <p style={{ fontWeight: 500, color: 'var(--ink-2)', marginBottom: 14 }}>
              {search
                ? `Nothing matches "${search}"`
                : user?.role === 'manager'
                  ? 'No campaigns assigned to you yet'
                  : 'No campaigns yet'}
            </p>
            {!search && user?.role !== 'manager' && (
              <Link href="/campaigns/new">
                <Button variant="ink" size="sm">
                  <Plus size={13} />
                  Start a campaign
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { label: 'Theme',    align: 'left'  },
                  { label: 'Channel',  align: 'left'  },
                  { label: 'Stage',    align: 'left'  },
                  { label: 'Pipeline', align: 'left'  },
                  { label: 'Created',  align: 'left'  },
                  { label: '',         align: 'right' },
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign:     h.align as 'left' | 'right',
                      fontFamily:    'var(--mono)',
                      fontSize:      10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color:         'var(--ink-3)',
                      fontWeight:    400,
                      padding:       '12px 16px',
                      borderBottom:  '1px solid var(--hair)',
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.map((c, rowIdx) => {
                const nextPage = STAGE_NEXT[c.stage] ?? 'ideas'
                const isLast   = rowIdx === paginated.length - 1

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: isLast ? 'none' : '1px solid var(--hair)',
                      cursor:       'pointer',
                      transition:   'background .12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => router.push(`/campaigns/${c.id}/${nextPage}`)}
                  >
                    {/* Theme (serif) + meta (mono) */}
                    <td style={{ padding: '15px 16px' }}>
                      <div
                        style={{
                          fontFamily:    'var(--serif)',
                          fontSize:      17,
                          fontWeight:    500,
                          color:         'var(--ink)',
                          letterSpacing: '-0.01em',
                          lineHeight:    1.2,
                        }}
                      >
                        {c.theme}
                      </div>
                      <div
                        style={{
                          fontFamily:    'var(--mono)',
                          fontSize:      11,
                          color:         'var(--ink-3)',
                          marginTop:     2,
                          textTransform: 'capitalize',
                        }}
                      >
                        {c.tone} · {audienceLabel(c.audience)}{user?.full_name ? ` · ${user.full_name}` : ''}
                      </div>
                    </td>

                    {/* Channel — base pill style + Instagram icon */}
                    <td style={{ padding: '15px 16px' }}>
                      <span
                        style={{
                          display:       'inline-flex',
                          alignItems:    'center',
                          gap:           7,
                          fontFamily:    'var(--mono)',
                          fontSize:      10.5,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          fontWeight:    400,
                          padding:       '4px 9px',
                          borderRadius:  6,
                          border:        '1px solid var(--hair-2)',
                          color:         'var(--ink-2)',
                          background:    'var(--card)',
                          lineHeight:    1,
                        }}
                      >
                        <span style={{ display: 'flex', color: 'var(--a)' }}>
                          <InstagramIcon size={12} />
                        </span>
                        Story
                      </span>
                    </td>

                    {/* Stage pill */}
                    <td style={{ padding: '15px 16px' }}>
                      <StagePill stage={c.stage} />
                    </td>

                    {/* 5-segment mini-pipeline */}
                    <td style={{ padding: '15px 16px' }}>
                      <MiniPipe stage={c.stage} />
                    </td>

                    {/* Date */}
                    <td style={{ padding: '15px 16px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize:   12,
                          color:      'var(--ink-3)',
                        }}
                      >
                        {formatDateShort(c.created_at)}
                      </span>
                    </td>

                    {/* Open › */}
                    <td style={{ padding: '15px 16px', textAlign: 'right' }}>
                      <Link
                        href={`/campaigns/${c.id}/${nextPage}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          display:        'inline-flex',
                          alignItems:     'center',
                          gap:            5,
                          color:          'var(--ink-2)',
                          fontWeight:     600,
                          fontSize:       13,
                          textDecoration: 'none',
                          whiteSpace:     'nowrap',
                        }}
                      >
                        Open
                        <ChevronRight size={15} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

      </div>
    </div>
  )
}

