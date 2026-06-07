'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/lib/auth'
import { Avatar } from '@/components/avatar'
import { StagePill } from '@/components/stage-pill'
import { Users, Clock, CheckCircle2, ChevronRight } from 'lucide-react'

interface Publisher {
  id: string; full_name: string; email: string
  total: number; pending: number; in_progress: number; posted: number
}
interface QueueItem {
  campaign_id: string; theme: string; stage: string
  publisher_name: string; publisher_id: string; created_at: string
}

// ─── Pending count pill ───────────────────────────────────────────────────────

function PendingPill({ count }: { count: number }) {
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        fontFamily:    'var(--mono)',
        fontSize:      11,
        fontWeight:    700,
        padding:       '3px 8px',
        borderRadius:  99,
        background:    'var(--pending-soft)',
        border:        '1px solid var(--a-line)',
        color:         'var(--a-ink)',
      }}
    >
      {count}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManagerPage() {
  const user = useUser()
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [queue,      setQueue]      = useState<QueueItem[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (user === undefined) return
    if (!user || !['manager', 'admin'].includes(user.role)) return
    fetch('/api/admin/manager-overview')
      .then(r => r.json())
      .then(d => { setPublishers(d.publishers ?? []); setQueue(d.queue ?? []) })
      .finally(() => setLoading(false))
  }, [user])

  // ── Loading ──────────────────────────────────────────────────
  if (user === undefined || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--ink)', borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
      </div>
    )
  }

  // ── Access denied ────────────────────────────────────────────
  if (!user || !['manager', 'admin'].includes(user.role)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 6 }}>
        <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Access denied</p>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Manager or Admin role required.</p>
      </div>
    )
  }

  const totalPending = publishers.reduce((s, p) => s + p.pending, 0)
  const totalPosted  = publishers.reduce((s, p) => s + p.posted,  0)

  return (
    <div style={{ padding: '28px 40px 60px' }}>

      {/* ── Masthead ──────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <span
          style={{
            display:       'block',
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
            marginBottom:  10,
          }}
        >
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>01</span>
          {'  '}Oversight
        </span>
        <h1
          style={{
            fontFamily:    'var(--serif)',
            fontSize:      40,
            fontWeight:    500,
            letterSpacing: '-0.025em',
            color:         'var(--ink)',
            margin:        '0 0 6px',
            lineHeight:    1.1,
          }}
        >
          Manager Overview
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, margin: 0 }}>
          Every publisher, every approval waiting on you.
        </p>
      </div>

      {/* ── Figure row (3-up stats) ────────────────────────── */}
      <div
        style={{
          display:       'flex',
          background:    'var(--card)',
          border:        '1px solid var(--hair)',
          borderRadius:  14,
          boxShadow:     'var(--shadow-sm)',
          overflow:      'hidden',
          marginBottom:  22,
        }}
      >
        {[
          { label: 'Publishers',       value: publishers.length, icon: <Users size={16} />,        sub: 'Active this week' },
          { label: 'Awaiting Approval', value: totalPending,      icon: <Clock size={16} />,        sub: totalPending ? 'Needs your review' : 'All clear' },
          { label: 'Total Posted',      value: totalPosted,       icon: <CheckCircle2 size={16} />, sub: 'Live on Instagram' },
        ].map((fig, i, arr) => (
          <div
            key={fig.label}
            style={{
              flex:        1,
              padding:     '20px 24px',
              borderRight: i < arr.length - 1 ? '1px solid var(--hair)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ color: 'var(--ink-3)' }}>{fig.icon}</span>
              <span
                style={{
                  fontFamily:    'var(--mono)',
                  fontSize:      10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color:         'var(--ink-3)',
                }}
              >
                {fig.label}
              </span>
            </div>
            <div
              style={{
                fontFamily:    'var(--serif)',
                fontSize:      44,
                fontWeight:    500,
                letterSpacing: '-0.02em',
                color:         'var(--ink)',
                lineHeight:    1,
                marginBottom:  4,
              }}
            >
              {fig.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{fig.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Two-column grid: Publishers + Queue ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>

        {/* Publishers table */}
        <div
          style={{
            background:   'var(--card)',
            border:       '1px solid var(--hair)',
            borderRadius: 14,
            boxShadow:    'var(--shadow-sm)',
            overflow:     'hidden',
          }}
        >
          {/* Table header bar */}
          <div
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         8,
              padding:     '13px 18px',
              borderBottom: '1px solid var(--hair)',
            }}
          >
            <Users size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Publishers</span>
            <span
              style={{
                marginLeft:    'auto',
                fontFamily:    'var(--mono)',
                fontSize:      11,
                color:         'var(--ink-3)',
              }}
            >
              {publishers.length} total
            </span>
          </div>

          {publishers.length === 0 ? (
            <div style={{ padding: '40px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5 }}>
              No publishers yet
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--paper-2)' }}>
                  {[
                    { label: 'Name',    align: 'left',   color: 'var(--ink-3)' },
                    { label: 'Total',   align: 'center', color: 'var(--ink-3)' },
                    { label: 'Pending', align: 'center', color: 'var(--a-ink)'  },
                    { label: 'Live',    align: 'center', color: 'var(--go-ink)' },
                  ].map(h => (
                    <th
                      key={h.label}
                      style={{
                        textAlign:     h.align as 'left' | 'center',
                        padding:       '9px 14px',
                        fontFamily:    'var(--mono)',
                        fontSize:      10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color:         h.color,
                        fontWeight:    400,
                      }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {publishers.map((p, pi) => (
                  <tr
                    key={p.id}
                    style={{ borderTop: pi > 0 ? '1px solid var(--hair)' : 'none', transition: 'background .12s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--paper-2)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    {/* Name + avatar */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={p.full_name || p.email} role="publisher" size={32} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                            {p.full_name || 'Unnamed'}
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                            {p.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total */}
                    <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)' }}>
                      {p.total}
                    </td>

                    {/* Pending */}
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      {p.pending > 0
                        ? <PendingPill count={p.pending} />
                        : <span style={{ color: 'var(--hair-2)' }}>—</span>}
                    </td>

                    {/* Live (posted) */}
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      {p.posted > 0 ? (
                        <span
                          style={{
                            display:      'inline-flex',
                            alignItems:   'center',
                            fontFamily:   'var(--mono)',
                            fontSize:     11,
                            fontWeight:   700,
                            padding:      '3px 8px',
                            borderRadius: 99,
                            background:   'var(--go-soft)',
                            border:       '1px solid color-mix(in oklab, var(--go) 30%, white)',
                            color:        'var(--go-ink)',
                          }}
                        >
                          {p.posted}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--hair-2)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Approval queue */}
        <div
          style={{
            background:    'var(--card)',
            border:        '1px solid var(--hair)',
            borderRadius:  14,
            boxShadow:     'var(--shadow-sm)',
            overflow:      'hidden',
            display:       'flex',
            flexDirection: 'column',
            alignSelf:     'start',
          }}
        >
          {/* Queue header */}
          <div
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         8,
              padding:     '13px 18px',
              borderBottom: '1px solid var(--hair)',
              flexShrink:  0,
            }}
          >
            <Clock size={14} style={{ color: 'var(--pending)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Approval Queue</span>
            {totalPending > 0 && (
              <span style={{ marginLeft: 'auto' }}>
                <PendingPill count={totalPending} />
              </span>
            )}
          </div>

          {/* Queue list */}
          {queue.length === 0 ? (
            <div
              style={{
                padding:        '40px 18px',
                textAlign:      'center',
                color:          'var(--ink-3)',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            8,
              }}
            >
              <CheckCircle2 size={22} style={{ color: 'var(--go)' }} />
              <span style={{ fontSize: 13.5 }}>All clear — nothing pending</span>
            </div>
          ) : queue.map((item, i) => {
            const nextPage = item.stage.includes('ideas')
              ? 'ideas' : item.stage.includes('images')
              ? 'images' : 'design'
            return (
              <div
                key={item.campaign_id}
                style={{
                  padding:      '13px 18px',
                  borderBottom: i < queue.length - 1 ? '1px solid var(--hair)' : 'none',
                  transition:   'background .12s',
                  cursor:       'default',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--paper-2)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                  <div
                    style={{
                      fontFamily:   'var(--serif)',
                      fontSize:     16,
                      flex:         1,
                      minWidth:     0,
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                      color:        'var(--ink)',
                    }}
                  >
                    {item.theme}
                  </div>
                  <Link
                    href={`/campaigns/${item.campaign_id}/${nextPage}`}
                    style={{
                      display:        'inline-flex',
                      alignItems:     'center',
                      gap:            3,
                      flexShrink:     0,
                      color:          'var(--b-ink)',
                      fontWeight:     600,
                      fontSize:       12.5,
                      textDecoration: 'none',
                    }}
                  >
                    Review <ChevronRight size={12} />
                  </Link>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize:   11,
                    color:      'var(--ink-3)',
                    marginBottom: 8,
                  }}
                >
                  {item.publisher_name}
                </div>
                <StagePill stage={item.stage} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
