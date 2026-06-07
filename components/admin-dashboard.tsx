'use client'

import { useEffect, useState } from 'react'
import {
  RefreshCw, AlertCircle, XCircle, CheckCircle2,
  TrendingUp, Lightbulb, Send, Database, Cpu,
  Users, FileCheck2, Settings, Sparkles,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  users:          { total: number; byRole: Record<string, number>; managersWithSlack: number; managersTotal: number }
  campaigns:      { total: number; byStage: Record<string, number> }
  ideas:          { total: number; byStatus: Record<string, number> }
  images:         { total: number }
  posts:          { total: number }
  tokens:         { total: number; used: number; expired: number; active: number; recent: any[] }
  ai:             { model: string; provider: string; totalGenerations: number; estimatedTokensUsed: number; credits: { label: string; remaining: number | null; limit: number | null } }
  db:             { tables: { name: string; rows: number }[] }
  globalSettings: Record<string, boolean>
  generatedAt:    string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString() }
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0 }

const SETTINGS_META: { key: string; label: string }[] = [
  { key: 'supabase',      label: 'Supabase'         },
  { key: 'openrouter',    label: 'OpenRouter AI'    },
  { key: 'slack_bot',     label: 'Slack Bot'        },
  { key: 'slack_webhook', label: 'Slack Webhook'    },
  { key: 'resend',        label: 'Resend Email'     },
  { key: 'google_search', label: 'Google Search'    },
  { key: 'unsplash',      label: 'Unsplash'         },
  { key: 'instagram',     label: 'Instagram / Meta' },
]

// Stage label + bar-fill colour mapping, matching the reference exactly
const STAGE_ROWS: { key: string; label: string; color: string }[] = [
  { key: 'ideas_pending',    label: 'Ideas pending',    color: 'var(--pending)' },
  { key: 'ideas_approved',   label: 'Ideas approved',   color: 'var(--go)'      },
  { key: 'images_pending',   label: 'Images pending',   color: 'var(--pending)' },
  { key: 'images_approved',  label: 'Images approved',  color: 'var(--go)'      },
  { key: 'stories_pending',  label: 'Stories pending',  color: 'var(--pending)' },
  { key: 'stories_approved', label: 'Stories approved', color: 'var(--go)'      },
  { key: 'design_ready',     label: 'Design ready',     color: 'var(--ink)'     },
  { key: 'posted',           label: 'Posted',           color: 'var(--go)'      },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

/** hairline section divider: eyebrow label + rule */
function SecHead({ num, label }: { num?: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 16px' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 400, whiteSpace: 'nowrap' }}>
        {num && <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{num}</span>}
        {num && '  '}{label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
    </div>
  )
}

/** .figure — matches wyr.css exactly; sub uses mono */
function Figure({
  label, value, sub, subColor, icon, last = false,
}: {
  label: string; value: string | number; sub: string
  subColor?: string; icon: React.ReactNode; last?: boolean
}) {
  return (
    <div style={{ padding: '20px 22px', borderRight: last ? 'none' : '1px solid var(--hair)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          {label}
        </span>
        <span style={{ color: 'var(--ink-3)' }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 44, fontWeight: 500, lineHeight: 1, marginTop: 10, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
        {value}
      </div>
      {/* f-sub: mono, 12.5px, 0.02em tracking */}
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, letterSpacing: '0.02em', color: subColor ?? 'var(--ink-3)', marginTop: 9 }}>
        {sub}
      </div>
    </div>
  )
}

/** .card-hd — card header strip */
function CardHd({ icon, title, right }: { icon?: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 20px', borderBottom: '1px solid var(--hair)' }}>
      {icon && <span style={{ color: 'var(--ink-3)', display: 'flex', flexShrink: 0 }}>{icon}</span>}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-2)', fontWeight: 700 }}>
        {title}
      </span>
      {right && (
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink-3)' }}>
          {right}
        </span>
      )}
    </div>
  )
}

/** Inline pill for token list — mirrors wyr.css .pill variants */
function TokenPill({ status }: { status: 'active' | 'used' | 'expired' }) {
  const cfg = {
    active:  { borderColor: 'color-mix(in oklab, var(--go) 40%, white)', color: 'var(--go-ink)', background: 'var(--go-soft)',      dot: 'var(--go)'      },
    used:    { borderColor: 'var(--hair-2)',                              color: 'var(--ink-2)',  background: 'var(--card)',          dot: 'var(--ink-3)'  },
    expired: { borderColor: 'var(--a-line)',                              color: 'var(--a-ink)',  background: 'var(--pending-soft)',  dot: 'var(--pending)' },
  }[status]
  const label = { active: 'Active', used: 'Used', expired: 'Expired' }[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '4px 9px', borderRadius: 6, border: '1px solid',
      borderColor: cfg.borderColor, color: cfg.color, background: cfg.background,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: cfg.dot }} />
      {label}
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [data,        setData]        = useState<DashboardData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/admin/dashboard')
      if (!r.ok) throw new Error('Failed to load dashboard data')
      setData(await r.json())
      setLastRefresh(new Date())
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, gap: 10, color: 'var(--ink-3)', fontSize: 14, fontFamily: 'var(--sans)' }}>
      <RefreshCw size={15} style={{ animation: 'spin .7s linear infinite' }} />
      Loading system data…
    </div>
  )
  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--sans)' }}>
      <AlertCircle size={28} style={{ marginBottom: 8 }} /><p>{error}</p>
    </div>
  )
  if (!data) return null

  const { users, campaigns, ideas, images, posts, tokens, ai, db, globalSettings } = data

  const connectedCount    = Object.values(globalSettings).filter(Boolean).length
  const totalIntegrations = Object.keys(globalSettings).length
  const dbTotalRows       = db.tables.reduce((s, t) => s + t.rows, 0)
  const approvalRate      = pct(
    ideas.byStatus['approved'] ?? 0,
    (ideas.byStatus['approved'] ?? 0) + (ideas.byStatus['rejected'] ?? 0),
  )
  const maxStageCount = Math.max(1, ...Object.values(campaigns.byStage))

  return (
    <div style={{ padding: '34px 40px 80px', maxWidth: 1320, margin: '0 auto', fontFamily: 'var(--sans)' }}>

      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
        <div>
          {/* eyebrow */}
          <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>00</span>
            {'  '}System control
          </span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 46, letterSpacing: '-0.025em', lineHeight: 1.0, color: 'var(--ink)', margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 15.5, margin: '12px 0 0' }}>
            Integrations, AI usage &amp; database — then the content pipeline below.
          </p>
        </div>

        {/* time-chip — mono 12px, 0.04em, ink-2, NOT uppercase */}
        <button
          onClick={load} disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.04em',
            color: 'var(--ink-2)', border: '1px solid var(--hair-2)',
            background: 'var(--card)', borderRadius: 9, padding: '8px 13px',
            cursor: 'pointer', transition: 'background .14s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card)' }}
        >
          <RefreshCw size={14} style={{ color: 'var(--ink-3)', animation: loading ? 'spin .7s linear infinite' : 'none', flexShrink: 0 }} />
          {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════
          SYSTEM
         ════════════════════════════════════════════════════════════ */}
      <SecHead label="System" />

      {/* 4-up figure row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--hair)', borderRadius: 14, overflow: 'hidden', background: 'var(--card)', marginBottom: 22 }}>
        <Figure
          label="Integrations"
          value={`${connectedCount}/${totalIntegrations}`}
          sub={connectedCount === totalIntegrations ? 'All services connected' : `${totalIntegrations - connectedCount} not configured`}
          icon={<Settings size={16} />}
        />
        <Figure
          label="AI Generations"
          value={fmt(ai.totalGenerations)}
          sub={`≈ ${fmt(ai.estimatedTokensUsed)} tokens used`}
          icon={<Cpu size={16} />}
        />
        <Figure
          label="Database Rows"
          value={fmt(dbTotalRows)}
          sub={`${db.tables.length} tables tracked`}
          icon={<Database size={16} />}
        />
        <Figure
          label="Approval Tokens"
          value={tokens.total}
          sub={`${tokens.active} active · ${tokens.used} used`}
          icon={<FileCheck2 size={16} />}
          last
        />
      </div>

      {/* Integration health */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--hair)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 22 }}>
        <CardHd
          icon={<Settings size={15} />}
          title="Global Settings · Integration Health"
          right={<>{connectedCount}/{totalIntegrations} configured</>}
        />

        {/* 4×2 hairline grid — .intg-grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {SETTINGS_META.map(({ key, label }, i) => {
            const on        = !!globalSettings[key]
            const isLastCol = (i + 1) % 4 === 0
            const isLastRow = i >= SETTINGS_META.length - 4
            return (
              <div
                key={key}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '17px 20px',
                  borderRight:  isLastCol ? 'none' : '1px solid var(--hair)',
                  borderBottom: isLastRow ? 'none' : '1px solid var(--hair)',
                }}
              >
                {/* sico — 18px icon */}
                <span style={{ color: on ? 'var(--go)' : 'var(--ink-3)', opacity: on ? 1 : 0.7, display: 'flex', flexShrink: 0, marginTop: 1 }}>
                  {on
                    ? <CheckCircle2 size={18} />
                    : <XCircle size={18} />}
                </span>
                <div>
                  {/* .nm — 14px weight-600 var(--ink) */}
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{label}</div>
                  {/* .st — mono 10.5px 0.1em uppercase */}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4, color: on ? 'var(--go-ink)' : 'var(--ink-3)' }}>
                    {on ? 'Configured' : 'Not set'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Usage + Database — .grid-2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 42 }}>

        {/* AI Usage card */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--hair)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <CardHd
            icon={<Sparkles size={15} />}
            title="AI Usage"
            right={<>{ai.provider} · {ai.model}</>}
          />
          {/* .ai-figs — 2-col, each figure has border-right + border-bottom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {[
              { label: 'Generations', value: fmt(ai.totalGenerations)     },
              { label: 'Est. Tokens', value: fmt(ai.estimatedTokensUsed)  },
            ].map(({ label, value }, i) => (
              <div
                key={label}
                style={{
                  padding: '20px 22px',
                  borderRight:  i === 0 ? '1px solid var(--hair)' : 'none',
                  borderBottom: '1px solid var(--hair)',
                }}
              >
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 44, fontWeight: 500, lineHeight: 1, marginTop: 10, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Credit well — .well */}
          <div style={{ margin: '18px 20px 20px', padding: '16px 18px', background: 'var(--paper-2)', border: '1px solid var(--hair)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Credits</div>
            {ai.credits.limit !== null ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 4, background: 'var(--hair-2)', borderRadius: 99, marginBottom: 8 }}>
                  <div style={{ width: `${pct(ai.credits.remaining ?? 0, ai.credits.limit)}%`, height: '100%', background: 'var(--go)', borderRadius: 99, transition: 'width .4s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  <span>${(ai.credits.remaining ?? 0).toFixed(2)} remaining</span>
                  <span>${ai.credits.limit.toFixed(2)} limit</span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--ink-2)', fontSize: 14, marginTop: 6 }}>Credit info unavailable</div>
            )}
          </div>
        </div>

        {/* Database card */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--hair)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <CardHd
            icon={<Database size={15} />}
            title="Database"
            right={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--go-ink)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--go)', display: 'inline-block' }} />
                Connected
              </span>
            }
          />
          {/* .tbl .db-tbl */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left',  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 400, padding: '12px 16px', borderBottom: '1px solid var(--hair)' }}>Table</th>
                <th style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 400, padding: '12px 16px', borderBottom: '1px solid var(--hair)' }}>Rows</th>
              </tr>
            </thead>
            <tbody>
              {db.tables.map((t, i) => (
                <tr key={t.name} style={{ borderBottom: i < db.tables.length - 1 ? '1px solid var(--hair)' : 'none' }}>
                  {/* td.tn — mono 13px var(--ink) */}
                  <td style={{ padding: '15px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{t.name}</td>
                  {/* td.rc — serif 17px var(--ink) weight-500 right-aligned */}
                  <td style={{ padding: '15px 16px', fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: 'var(--ink)', textAlign: 'right' }}>{fmt(t.rows)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          CONTENT PIPELINE
         ════════════════════════════════════════════════════════════ */}
      <SecHead num="01" label="Content pipeline" />

      {/* 4-up figure row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--hair)', borderRadius: 14, overflow: 'hidden', background: 'var(--card)', marginBottom: 22 }}>
        <Figure
          label="Campaigns"
          value={campaigns.total}
          sub={`${campaigns.byStage['ideas_pending'] ?? 0} ideas pending`}
          icon={<TrendingUp size={16} />}
        />
        <Figure
          label="Ideas Generated"
          value={ideas.total}
          sub={`${approvalRate}% approval rate`}
          subColor="var(--go-ink)"
          icon={<Lightbulb size={16} />}
        />
        <Figure
          label="Users"
          value={users.total}
          sub={`${users.managersWithSlack}/${users.managersTotal} managers on Slack`}
          icon={<Users size={16} />}
        />
        <Figure
          label="Published Posts"
          value={posts.total}
          sub={`${fmt(images.total)} images indexed`}
          icon={<Send size={16} />}
          last
        />
      </div>

      {/* Pipeline by Stage + Approval Tokens — .grid-2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>

        {/* Pipeline by stage */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--hair)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <CardHd title="Pipeline by Stage" />

          {/* .bars */}
          <div style={{ padding: '8px 22px 20px', display: 'flex', flexDirection: 'column' }}>
            {STAGE_ROWS.map(({ key, label, color }, i) => {
              const count = campaigns.byStage[key] ?? 0
              const w     = count > 0 ? pct(count, maxStageCount) : 0
              const isZero = count === 0
              return (
                <div
                  key={key}
                  style={{
                    display: 'grid', gridTemplateColumns: '130px 1fr 30px',
                    alignItems: 'center', gap: 16, padding: '9px 0',
                    borderTop: i > 0 ? '1px solid var(--hair)' : 'none',
                  }}
                >
                  {/* .bl — 13.5px weight-500 var(--ink-2) */}
                  <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500 }}>{label}</span>
                  {/* .bar-track — 6px */}
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--paper-2)', overflow: 'hidden' }}>
                    {!isZero && (
                      <div style={{ width: `${w}%`, height: '100%', borderRadius: 99, background: color, transition: 'width .4s' }} />
                    )}
                  </div>
                  {/* .bn — mono 13px var(--ink); zero = var(--hair-2) */}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: isZero ? 'var(--hair-2)' : 'var(--ink)', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Approval Tokens */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--hair)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', alignSelf: 'start' }}>
          <CardHd title="Approval Tokens" />

          {/* .tok-stats — 4-up serif 30px */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--hair)' }}>
            {[
              { label: 'Total',   value: tokens.total,   color: 'var(--ink)'    },
              { label: 'Active',  value: tokens.active,  color: 'var(--go-ink)' },
              { label: 'Used',    value: tokens.used,    color: 'var(--ink-2)'  },
              { label: 'Expired', value: tokens.expired, color: 'var(--ink-3)'  },
            ].map(({ label, value, color }, i) => (
              <div
                key={label}
                style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--hair)' : 'none' }}
              >
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
                {/* .tv — serif 30px weight-500 */}
                <div style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 500, lineHeight: 1, marginTop: 9, letterSpacing: '-0.02em', color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* .tok-list */}
          <div>
            {tokens.recent.map((t: any, i: number) => {
              const isExpired = !t.used && new Date(t.expires_at) < new Date()
              const status: 'active' | 'used' | 'expired' = t.used ? 'used' : isExpired ? 'expired' : 'active'
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 20px',
                    borderTop: i > 0 ? '1px solid var(--hair)' : 'none',
                  }}
                >
                  {/* .tok-lab — serif 16px var(--ink) */}
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', textTransform: 'capitalize' }}>
                    {t.approval_type}
                  </span>
                  <TokenPill status={status} />
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
