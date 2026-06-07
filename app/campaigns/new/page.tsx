'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { InstagramIcon, LinkedInIcon } from '@/components/icons'

// ─── Static data ─────────────────────────────────────────────────────────────

const EXAMPLE_THEMES = ['Travel', 'Food', 'Career', 'Tech', 'Relationships', 'Fitness', 'Money']

const TONES = [
  { value: 'fun',               label: 'Fun',               desc: 'Light, playful, shareable' },
  { value: 'thought-provoking', label: 'Thought-provoking', desc: 'Makes people pause'        },
  { value: 'controversial',     label: 'Controversial',     desc: 'Sparks a debate'           },
] as const

const AUDIENCES = [
  { value: 'general',       label: 'General',       desc: 'Broad appeal'            },
  { value: 'gen-z',         label: 'Gen Z',         desc: 'Younger, internet-native' },
  { value: 'professionals', label: 'Professionals', desc: 'Career-minded'            },
] as const

type Tone     = (typeof TONES)[number]['value']
type Audience = (typeof AUDIENCES)[number]['value']

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Mono uppercase section label */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display:       'block',
        fontFamily:    'var(--mono)',
        fontSize:      10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         'var(--ink-3)',
        marginBottom:  10,
      }}
    >
      {children}
    </span>
  )
}

/** Selectable card for Tone / Audience */
function SelectCard({
  label, desc, active, onClick,
}: {
  label: string; desc: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign:    'left',
        padding:      '12px 14px',
        display:      'block',
        width:        '100%',
        borderRadius: 10,
        cursor:       'pointer',
        border:       `1px solid ${active ? 'var(--ink)' : 'var(--hair-2)'}`,
        background:   active ? 'var(--ink)' : 'var(--card)',
        transition:   'all .14s',
        color:        active ? 'var(--paper)' : 'var(--ink-2)',
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget
          el.style.borderColor = 'var(--ink-3)'
          el.style.color       = 'var(--ink)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget
          el.style.borderColor = 'var(--hair-2)'
          el.style.color       = 'var(--ink-2)'
        }
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{desc}</div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter()

  const [theme,    setTheme]    = useState('')
  const [tone,     setTone]     = useState<Tone>('fun')
  const [audience, setAudience] = useState<Audience>('general')
  const [loading,  setLoading]  = useState(false)

  // ── Submit — UNCHANGED logic ────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!theme.trim()) return toast.error('Enter a theme to begin')

    setLoading(true)
    try {
      let id: string
      if (isDemoMode) {
        const campaign = demoStore.campaigns.insert({
          theme: theme.trim(), tone, audience, stage: 'ideas_pending',
        })
        id = campaign.id
      } else {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
          .from('campaigns')
          .insert({ theme: theme.trim(), tone, audience, stage: 'ideas_pending', user_id: user?.id })
          .select()
          .single()
        if (error) throw error
        id = data.id
      }
      toast.success('Campaign created — let\'s generate ideas')
      router.push(`/campaigns/${id}/ideas`)
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ padding: '34px 40px 80px', maxWidth: 760 }}>

      {/* ── Masthead ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
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
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>02</span>
          {'  '}New brief
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
          Start a duel.
        </h1>

        <p style={{ color: 'var(--ink-2)', fontSize: 15.5, marginTop: 12 }}>
          Give us a theme. We'll draft five "Would You Rather" questions for it.
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Channel picker ───────────────────────────────────── */}
        <div style={{ marginBottom: 26 }}>
          <FieldLabel>Channel</FieldLabel>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Instagram — selected */}
            <div
              style={{
                padding:      16,
                display:      'flex',
                gap:          12,
                alignItems:   'center',
                background:   'var(--card)',
                border:       '1.5px solid var(--ink)',
                borderRadius: 14,
                boxShadow:    'var(--shadow-sm)',
              }}
            >
              {/* Icon box */}
              <div
                style={{
                  width:           40,
                  height:          40,
                  borderRadius:    10,
                  background:      'var(--ink)',
                  color:           'var(--paper)',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  flexShrink:      0,
                }}
              >
                <InstagramIcon size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>Instagram</div>
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
                  Story · 9:16
                </div>
              </div>

              {/* Selected radio dot */}
              <span
                style={{
                  width:        18,
                  height:       18,
                  borderRadius: '50%',
                  border:       '5px solid var(--ink)',
                  flexShrink:   0,
                  display:      'block',
                }}
              />
            </div>

            {/* LinkedIn — disabled/soon */}
            <div
              style={{
                padding:      16,
                display:      'flex',
                gap:          12,
                alignItems:   'center',
                background:   'var(--paper-2)',
                border:       '1px solid var(--hair)',
                borderRadius: 14,
                opacity:      0.55,
                cursor:       'not-allowed',
                userSelect:   'none',
              }}
            >
              {/* Icon box */}
              <div
                style={{
                  width:          40,
                  height:         40,
                  borderRadius:   10,
                  background:     'var(--hair-2)',
                  color:          'var(--ink-3)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  flexShrink:     0,
                }}
              >
                <LinkedInIcon size={18} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>LinkedIn</div>
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
                  Carousel
                </div>
              </div>

              {/* "Soon" pill */}
              <span
                style={{
                  fontFamily:    'var(--mono)',
                  fontSize:      9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color:         'var(--ink-3)',
                  border:        '1px solid var(--hair-2)',
                  borderRadius:  5,
                  padding:       '2px 7px',
                  flexShrink:    0,
                }}
              >
                Soon
              </span>
            </div>
          </div>
        </div>

        {/* ── Brief card ──────────────────────────────────────── */}
        <div
          style={{
            background:   'var(--card)',
            border:       '1px solid var(--hair)',
            borderRadius: 14,
            boxShadow:    'var(--shadow-sm)',
            padding:      22,
          }}
        >

          {/* Theme textarea */}
          <div style={{ marginBottom: 0 }}>
            <FieldLabel>The theme</FieldLabel>

            <textarea
              rows={2}
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="e.g. Travel adventures, Career choices, Food preferences…"
              style={{
                width:        '100%',
                padding:      '14px 16px',
                background:   'var(--paper)',
                border:       '1.5px solid var(--hair-2)',
                borderRadius: 10,
                fontFamily:   'var(--serif)',
                fontSize:     18,
                color:        'var(--ink)',
                resize:       'none',
                outline:      'none',
                transition:   'border-color .15s, box-shadow .15s',
                boxSizing:    'border-box',
                lineHeight:   1.5,
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--ink)'
                e.target.style.boxShadow  = '0 0 0 3px color-mix(in oklab, var(--ink) 8%, transparent)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--hair-2)'
                e.target.style.boxShadow  = 'none'
              }}
            />

            {/* Example chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
              {EXAMPLE_THEMES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  style={{
                    padding:      '6px 12px',
                    fontSize:     13,
                    fontFamily:   'var(--sans)',
                    fontWeight:   500,
                    color:        'var(--ink-2)',
                    background:   'var(--paper-2)',
                    border:       '1px solid var(--hair-2)',
                    borderRadius: 7,
                    cursor:       'pointer',
                    transition:   'all .14s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.color       = 'var(--ink)'
                    el.style.background  = 'var(--card)'
                    el.style.borderColor = 'var(--ink)'
                    el.style.boxShadow   = 'var(--shadow-sm)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.color       = 'var(--ink-2)'
                    el.style.background  = 'var(--paper-2)'
                    el.style.borderColor = 'var(--hair-2)'
                    el.style.boxShadow   = 'none'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Hairline rule */}
          <div style={{ height: 1, background: 'var(--hair)', margin: '22px 0' }} />

          {/* Tone + Audience — 2-col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

            {/* Tone */}
            <div>
              <FieldLabel>Tone</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TONES.map(t => (
                  <SelectCard
                    key={t.value}
                    label={t.label}
                    desc={t.desc}
                    active={tone === t.value}
                    onClick={() => setTone(t.value)}
                  />
                ))}
              </div>
            </div>

            {/* Audience */}
            <div>
              <FieldLabel>Audience</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AUDIENCES.map(a => (
                  <SelectCard
                    key={a.value}
                    label={a.label}
                    desc={a.desc}
                    active={audience === a.value}
                    onClick={() => setAudience(a.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer row ───────────────────────────────────────── */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginTop:      22,
          }}
        >
          {/* Cancel */}
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              fontFamily:  'var(--sans)',
              fontSize:    14,
              fontWeight:  500,
              color:       'var(--ink-3)',
              background:  'transparent',
              border:      'none',
              cursor:      'pointer',
              padding:     '10px 4px',
              transition:  'color .14s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-3)')}
          >
            Cancel
          </button>

          {/* Generate Ideas — flame CTA */}
          <Button type="submit" variant="a" size="lg" disabled={loading}>
            {loading ? 'Creating…' : 'Generate Ideas'}
            <Sparkles size={16} />
          </Button>
        </div>
      </form>
    </div>
  )
}
