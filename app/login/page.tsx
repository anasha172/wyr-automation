'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight } from 'lucide-react'

// ─── Demo accounts ────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS_BASE = [
  {
    role:     'publisher' as const,
    name:     'Publisher',   // fallback — overwritten by DB name on mount
    email:    'publisher@wyr-demo.com',
    password: 'demo1234',
    desc:     'Create & run campaigns',
  },
  {
    role:     'manager' as const,
    name:     'Manager',
    email:    'manager@wyr-demo.com',
    password: 'demo1234',
    desc:     'Review & approve work',
  },
  {
    role:     'admin' as const,
    name:     'Admin',
    email:    'admin@wyr-demo.com',
    password: 'demo1234',
    desc:     'Users, settings, all access',
  },
]

// ─── StyledInput ──────────────────────────────────────────────────────────────

function StyledInput({
  type, value, onChange, placeholder, required,
}: {
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <input
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width:        '100%',
        boxSizing:    'border-box',
        border:       '1.5px solid var(--hair-2)',
        borderRadius: 9,
        padding:      '10px 13px',
        fontFamily:   'var(--sans)',
        fontSize:     14,
        color:        'var(--ink)',
        background:   'var(--paper)',
        outline:      'none',
        transition:   'border-color .14s',
      }}
      onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)')}
      onBlur={e  => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--hair-2)')}
    />
  )
}

// ─── PostDeckMark — wordmark: Post (paper) · Deck (cobalt) ──────────────────────

const COBALT_BRIGHT = 'oklch(0.68 0.17 264)'   // lifted cobalt, legible on --ink

// ─── LoginForm ────────────────────────────────────────────────────────────────

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
  const [demoNames,   setDemoNames]   = useState<Record<string, string>>({})

  // Fetch live names from DB so they stay in sync with User Management
  useEffect(() => {
    fetch('/api/demo-accounts')
      .then(r => r.ok ? r.json() : {})
      .then(setDemoNames)
      .catch(() => {})
  }, [])

  const demoAccounts = DEMO_ACCOUNTS_BASE.map(a => ({
    ...a,
    name: demoNames[a.email] || a.name,
  }))

  async function signIn(e_mail: string, pass: string, isDemo = false) {
    setError('')
    if (isDemo) setDemoLoading(e_mail)
    else setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email: e_mail, password: pass })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      setDemoLoading(null)
      return
    }
    const next = searchParams.get('next') ?? '/'
    router.push(next)
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await signIn(email, password)
  }

  const busy = loading || !!demoLoading

  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: '1.1fr 1fr',
        height:              '100vh',
        overflow:            'hidden',
      }}
    >

      {/* ════════════════════════════════════════════════════════════════════
          Left: editorial ink panel — PostDeck
          ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background:    'var(--ink)',
          color:         'var(--paper)',
          padding:       '52px 60px',
          display:       'flex',
          flexDirection: 'column',
          position:      'relative',
          overflow:      'hidden',
        }}
      >
        {/* faint cobalt glow behind the deck */}
        <div
          aria-hidden
          style={{
            position:      'absolute',
            right:         -120,
            bottom:        -160,
            width:         560,
            height:        560,
            borderRadius:  '50%',
            background:    'radial-gradient(circle, color-mix(in oklab, var(--b) 38%, transparent), transparent 68%)',
            pointerEvents: 'none',
            zIndex:        0,
          }}
        />

        {/* Wordmark — Post (paper) · Deck (cobalt) */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'baseline', gap: 15 }}>
          <span
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      40,
              fontWeight:    700,
              letterSpacing: '-0.035em',
              lineHeight:    1,
            }}
          >
            <span style={{ color: 'var(--paper)' }}>Post</span>
            <span style={{ color: COBALT_BRIGHT }}>Deck</span>
          </span>
          <span
            style={{
              fontFamily:    'var(--mono)',
              fontSize:      10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'rgba(251,250,247,0.5)',
              paddingBottom: 2,
            }}
          >
            Studio
          </span>
        </div>

        {/* Center: pipeline kicker + headline + lede + platform chips */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', marginBottom: 'auto', maxWidth: '28ch' }}>
          <div
            style={{
              fontFamily:    'var(--mono)',
              fontSize:      11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color:         'rgba(251,250,247,0.5)',
              marginBottom:  20,
            }}
          >
            Brief <span style={{ color: COBALT_BRIGHT }}>→</span> Approve{' '}
            <span style={{ color: COBALT_BRIGHT }}>→</span> Design{' '}
            <span style={{ color: COBALT_BRIGHT }}>→</span> Publish
          </div>

          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      58,
              fontWeight:    500,
              lineHeight:    1.02,
              letterSpacing: '-0.03em',
              color:         'var(--paper)',
              margin:        0,
            }}
          >
            One deck<br />
            for every<br />
            <span style={{ fontStyle: 'italic' }}>post.</span>
          </h1>

          <p
            style={{
              color:      'rgba(251,250,247,0.62)',
              fontSize:   16,
              marginTop:  22,
              maxWidth:   '29ch',
              lineHeight: 1.6,
            }}
          >
            From a one-line brief to a published carousel — Instagram Stories and
            LinkedIn posts, generated, approved, designed and shipped in one place.
          </p>

          {/* Platform chips — the two content types PostDeck ships */}
          <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
            {[
              { label: 'Instagram Stories', dot: 'var(--a)' },
              { label: 'LinkedIn Posts',    dot: COBALT_BRIGHT },
            ].map(chip => (
              <span
                key={chip.label}
                style={{
                  display:       'inline-flex',
                  alignItems:    'center',
                  gap:           8,
                  padding:       '7px 13px 7px 11px',
                  border:        '1px solid rgba(251,250,247,0.16)',
                  borderRadius:  999,
                  fontFamily:    'var(--mono)',
                  fontSize:      10.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color:         'rgba(251,250,247,0.82)',
                  background:    'rgba(251,250,247,0.03)',
                }}
              >
                <span
                  style={{
                    width:        7,
                    height:       7,
                    borderRadius: '50%',
                    flexShrink:   0,
                    background:   chip.dot,
                    boxShadow:    `0 0 0 3px color-mix(in oklab, ${chip.dot} 30%, transparent)`,
                  }}
                />
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position:      'relative',
            zIndex:        1,
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.14em',
            color:         'rgba(251,250,247,0.4)',
            textTransform: 'uppercase',
          }}
        >
          Internal content studio · v2
        </div>

        {/* ── The fanned POST DECK — pure CSS + photos, replaces StoryFrame ── */}
        <div
          aria-hidden
          style={{ position: 'absolute', right: -40, bottom: -44, zIndex: 0, width: 230, height: 324 }}
        >
          {/* LinkedIn job card — behind, peeking left */}
          <div
            style={{
              position:      'absolute',
              width:         174,
              height:        218,
              left:          6,
              bottom:        92,
              transform:     'rotate(-9deg)',
              background:    'var(--card)',
              border:        '1px solid var(--hair)',
              borderRadius:  16,
              overflow:      'hidden',
              boxShadow:     'var(--shadow-lg)',
              display:       'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ height: 56, position: 'relative', overflow: 'hidden', background: 'oklch(0.45 0.16 266)' }}>
              <img
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&q=80"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position:     'absolute',
                  inset:        0,
                  background:   'linear-gradient(135deg, color-mix(in oklab, var(--b) 72%, transparent), color-mix(in oklab, oklch(0.42 0.16 266) 78%, transparent))',
                  mixBlendMode: 'multiply',
                }}
              />
              <div
                style={{
                  position:       'absolute',
                  left:           16,
                  bottom:         -18,
                  width:          44,
                  height:         44,
                  borderRadius:   11,
                  background:     'var(--paper)',
                  border:         '2px solid var(--card)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontFamily:     'var(--serif)',
                  fontWeight:     700,
                  fontSize:       19,
                  color:          'var(--b)',
                  boxShadow:      'var(--shadow-sm)',
                }}
              >
                N
              </div>
            </div>
            <div style={{ padding: '28px 16px 0' }}>
              <div
                style={{
                  fontFamily:    'var(--mono)',
                  fontSize:      8.5,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color:         'var(--b-ink)',
                  fontWeight:    700,
                }}
              >
                Now Hiring
              </div>
              <div
                style={{
                  fontFamily:    'var(--serif)',
                  fontSize:      18,
                  fontWeight:    600,
                  lineHeight:    1.12,
                  letterSpacing: '-0.01em',
                  color:         'var(--ink)',
                  margin:        '7px 0 0',
                }}
              >
                Senior Product Designer
              </div>
              <div
                style={{
                  fontFamily:    'var(--mono)',
                  fontSize:      9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color:         'var(--ink-3)',
                  marginTop:     9,
                }}
              >
                Remote · Full-time
              </div>
            </div>
            {/* carousel dots */}
            <div style={{ display: 'flex', gap: 5, position: 'absolute', left: 16, bottom: 14 }}>
              <i style={{ width: 14, height: 5, borderRadius: 99, background: 'var(--b)', display: 'block' }} />
              <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--hair-2)', display: 'block' }} />
              <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--hair-2)', display: 'block' }} />
              <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--hair-2)', display: 'block' }} />
            </div>
          </div>

          {/* Instagram Story "duel" card — front */}
          <div
            style={{
              position:      'absolute',
              width:         182,
              height:        324,
              right:         14,
              bottom:        8,
              transform:     'rotate(7deg)',
              background:    'var(--ink)',
              borderRadius:  16,
              overflow:      'hidden',
              boxShadow:     'var(--shadow-lg)',
              display:       'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                position:      'absolute',
                top:           '7%',
                left:          0,
                right:         0,
                textAlign:     'center',
                zIndex:        3,
                fontFamily:    'var(--mono)',
                fontSize:      9.5,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color:         'rgba(255,255,255,0.94)',
              }}
            >
              Would You Rather
            </div>

            {/* A half — flame */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <img
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80"
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'var(--a)', mixBlendMode: 'multiply', opacity: 0.55 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.34))' }} />
              <div
                style={{
                  position:      'absolute',
                  bottom:        '12%',
                  left:          0,
                  right:         0,
                  padding:       '0 9%',
                  color:         '#fff',
                  fontFamily:    'var(--serif)',
                  fontWeight:    600,
                  textAlign:     'center',
                  letterSpacing: '-0.01em',
                  textShadow:    '0 2px 14px rgba(0,0,0,0.4)',
                  fontSize:      14,
                  lineHeight:    1.18,
                  zIndex:        1,
                }}
              >
                Read minds for a day
              </div>
            </div>

            {/* B half — cobalt */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <img
                src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&q=80"
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'var(--b)', mixBlendMode: 'multiply', opacity: 0.55 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.34))' }} />
              <div
                style={{
                  position:      'absolute',
                  top:           '12%',
                  left:          0,
                  right:         0,
                  padding:       '0 9%',
                  color:         '#fff',
                  fontFamily:    'var(--serif)',
                  fontWeight:    600,
                  textAlign:     'center',
                  letterSpacing: '-0.01em',
                  textShadow:    '0 2px 14px rgba(0,0,0,0.4)',
                  fontSize:      14,
                  lineHeight:    1.18,
                  zIndex:        1,
                }}
              >
                Be invisible for a day
              </div>
            </div>

            {/* vs disc */}
            <div
              style={{
                position:       'absolute',
                top:            '50%',
                left:           '50%',
                transform:      'translate(-50%, -50%)',
                zIndex:         4,
                width:          34,
                height:         34,
                borderRadius:   '50%',
                background:     'var(--paper)',
                color:          'var(--ink)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontFamily:     'var(--serif)',
                fontStyle:      'italic',
                fontWeight:     600,
                fontSize:       14,
                boxShadow:      '0 4px 16px rgba(0,0,0,0.35)',
                border:         '2px solid #fff',
                lineHeight:     1,
              }}
            >
              vs
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          Right: account picker + form  (UNCHANGED)
          ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        48,
          background:     'var(--paper)',
          overflowY:      'auto',
        }}
      >
        <div style={{ width: 360, maxWidth: '100%' }}>

          {/* Eyebrow */}
          <span
            style={{
              display:       'block',
              fontFamily:    'var(--mono)',
              fontSize:      10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'var(--ink-3)',
              marginBottom:  12,
            }}
          >
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>00</span>
            {'  '}Sign in
          </span>

          <h2
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      34,
              fontWeight:    500,
              letterSpacing: '-0.02em',
              color:         'var(--ink)',
              margin:        '0 0 6px',
            }}
          >
            Choose a seat
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 14.5, marginBottom: 24 }}>
            Pick a demo role to step into the studio.
          </p>

          {/* Account cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {demoAccounts.map(account => {
              const isSpinning = demoLoading === account.email
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => signIn(account.email, account.password, true)}
                  disabled={busy}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          14,
                    padding:      14,
                    background:   'var(--card)',
                    border:       '1px solid var(--hair)',
                    borderRadius: 12,
                    cursor:       busy ? 'not-allowed' : 'pointer',
                    opacity:      busy && !isSpinning ? 0.55 : 1,
                    textAlign:    'left',
                    transition:   'border-color .14s, box-shadow .14s',
                    width:        '100%',
                  }}
                  onMouseEnter={e => {
                    if (!busy) {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'var(--ink)'
                      el.style.boxShadow   = '0 2px 8px rgba(26,24,21,0.08)'
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--hair)'
                    el.style.boxShadow   = 'none'
                  }}
                >
                  {/* Avatar or spinner */}
                  {isSpinning ? (
                    <div
                      style={{
                        width:          42,
                        height:         42,
                        borderRadius:   '50%',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                        background:     'var(--paper-2)',
                      }}
                    >
                      <Loader2 size={18} style={{ animation: 'spin .7s linear infinite', color: 'var(--ink-3)' }} />
                    </div>
                  ) : (
                    <Avatar name={account.name} role={account.role} size={42} />
                  )}

                  {/* Name + role desc */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
                      {account.name}
                    </div>
                    <div
                      style={{
                        fontFamily:    'var(--mono)',
                        fontSize:      11,
                        color:         'var(--ink-3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginTop:     2,
                      }}
                    >
                      {account.role} · {account.desc}
                    </div>
                  </div>

                  <ArrowRight size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
            <span
              style={{
                fontFamily:    'var(--mono)',
                fontSize:      10.5,
                color:         'var(--ink-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label
                style={{
                  display:       'block',
                  fontFamily:    'var(--mono)',
                  fontSize:      10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color:         'var(--ink-3)',
                  marginBottom:  6,
                }}
              >
                Email
              </label>
              <StyledInput
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@studio.co"
              />
            </div>

            <div>
              <label
                style={{
                  display:       'block',
                  fontFamily:    'var(--mono)',
                  fontSize:      10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color:         'var(--ink-3)',
                  marginBottom:  6,
                }}
              >
                Password
              </label>
              <StyledInput
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                style={{
                  padding:      '9px 12px',
                  background:   'var(--a-soft)',
                  border:       '1px solid var(--a-line)',
                  borderRadius: 8,
                  fontSize:     13,
                  color:        'var(--a-ink)',
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="ink"
              disabled={busy}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading
                ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Signing in…</>
                : 'Sign in'}
            </Button>
          </form>

          {/* Footer note */}
          <p
            style={{
              textAlign:  'center',
              fontSize:   12,
              color:      'var(--ink-3)',
              marginTop:  18,
              lineHeight: 1.5,
            }}
          >
            Don't have an account?{' '}
            <span style={{ color: 'var(--ink-2)' }}>Contact your Admin to get access.</span>
          </p>

        </div>
      </div>

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
