'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/avatar'
import { StoryFrame } from '@/components/story-frame'
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

// Sample idea for the decorative StoryFrame on the ink panel.
// picsum seeds are stable — same seed → same photo every time.
// Plain <img> is used inside StoryFrame so no next/image remotePatterns needed.
const SAMPLE = {
  optionA: 'Read minds for a day',
  optionB: 'Be invisible for a day',
  imageA:  'https://picsum.photos/seed/wyrA/360/640',
  imageB:  'https://picsum.photos/seed/wyrB/360/640',
}

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

      {/* ── Left: editorial ink panel ───────────────────────────────────── */}
      <div
        style={{
          background:     'var(--ink)',
          color:          'var(--paper)',
          padding:        '52px 60px',
          display:        'flex',
          flexDirection:  'column',
          position:       'relative',
          overflow:       'hidden',
        }}
      >

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      40,
              fontWeight:    700,
              letterSpacing: '-0.03em',
              lineHeight:    1,
            }}
          >
            <span style={{ color: 'var(--a)' }}>W</span>
            <span style={{ color: 'oklch(0.7 0.16 262)' }}>Y</span>
            <span style={{ color: 'var(--paper)' }}>R</span>
          </span>
          <span
            style={{
              fontFamily:    'var(--mono)',
              fontSize:      10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'rgba(251,250,247,0.5)',
            }}
          >
            Studio
          </span>
        </div>

        {/* Center: pipeline kicker + headline + lede */}
        <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <div
            style={{
              fontFamily:    'var(--mono)',
              fontSize:      11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color:         'rgba(251,250,247,0.5)',
              marginBottom:  18,
            }}
          >
            Idea → Approval → Story → Posted
          </div>
          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      58,
              fontWeight:    500,
              lineHeight:    1.0,
              letterSpacing: '-0.03em',
              color:         'var(--paper)',
              margin:        0,
            }}
          >
            The whole<br />
            <span style={{ fontStyle: 'italic' }}>{'“Would You'}<br />{'Rather”'}</span><br />
            pipeline.
          </h1>
          <p
            style={{
              color:      'rgba(251,250,247,0.62)',
              fontSize:   16,
              marginTop:  22,
              maxWidth:   '38ch',
              lineHeight: 1.6,
            }}
          >
            From a one-word theme to a posted Instagram Story — generated,
            approved, designed and published in one place.
          </p>
        </div>

        {/* Tilted StoryFrame — decorative, bottom-right */}
        <div
          style={{
            position:  'absolute',
            right:     -30,
            bottom:    -40,
            transform: 'rotate(8deg)',
            opacity:   0.96,
          }}
        >
          <StoryFrame
            imageA={SAMPLE.imageA}
            imageB={SAMPLE.imageB}
            optionA={SAMPLE.optionA}
            optionB={SAMPLE.optionB}
            width={210}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.14em',
            color:         'rgba(251,250,247,0.4)',
            textTransform: 'uppercase',
          }}
        >
          Internal content studio · v2
        </div>
      </div>

      {/* ── Right: account picker + form ────────────────────────────────── */}
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
