'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, CheckCircle2, XCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VS } from '@/components/vs'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  token:        string
  tokenRow:     any
  theme:        string
  approvalType: 'ideas' | 'images'
  ideas:        any[]
  images:       { a: any[]; b: any[] }
}

// ─── Opt-tag used inside duel body ────────────────────────────────────────────

function OptTag({ side, align = 'left' }: { side: 'a' | 'b'; align?: 'left' | 'right' }) {
  const bg  = side === 'a' ? 'var(--a)'     : 'var(--b)'
  const col = side === 'a' ? 'var(--a-ink)' : 'var(--b-ink)'
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        gap:           6,
        fontFamily:    'var(--mono)',
        fontSize:      10.5,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color:         col,
      }}
    >
      <span
        style={{
          width:          18,
          height:         18,
          borderRadius:   '50%',
          background:     bg,
          color:          '#fff',
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       10,
          fontWeight:     700,
          flexShrink:     0,
        }}
      >
        {side.toUpperCase()}
      </span>
      Option {side.toUpperCase()}
    </span>
  )
}

// ─── Decision badge (shown in card header once decided) ───────────────────────

function DecisionBadge({ decision }: { decision: 'approved' | 'rejected' }) {
  return decision === 'approved' ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--go-ink)', fontWeight: 600, fontSize: 13 }}>
      <CheckCircle2 size={14} /> Approved
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--a-ink)', fontWeight: 600, fontSize: 13 }}>
      <XCircle size={14} /> Rejected
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ApprovalClient({ token, tokenRow, theme, approvalType, ideas, images }: Props) {
  const [ideaStatuses,  setIdeaStatuses]  = useState<Record<string, { status: 'approved' | 'rejected'; comment: string }>>({})
  const [selectedImageA, setSelectedImageA] = useState<string | null>(null)
  const [selectedImageB, setSelectedImageB] = useState<string | null>(null)
  const [submitted,     setSubmitted]     = useState(false)
  const [loading,       setLoading]       = useState(false)

  // ── Submit — unchanged ───────────────────────────────────────────────────────
  async function submitApproval() {
    setLoading(true)
    try {
      const res = await fetch('/api/submit-approval', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          campaignId:    tokenRow.campaign_id,
          approvalType,
          ideaStatuses,
          selectedImageA,
          selectedImageB,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const allDecided = approvalType === 'ideas'
    ? ideas.length > 0 && ideas.every(i => ideaStatuses[i.id]?.status)
    : !!selectedImageA && !!selectedImageB

  // ── Thank-you state ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        style={{
          minHeight:      '100vh',
          background:     'var(--paper)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        24,
        }}
      >
        <div
          style={{
            background:    'var(--card)',
            border:        '1px solid var(--hair)',
            borderRadius:  14,
            boxShadow:     'var(--shadow)',
            padding:       '48px 40px',
            textAlign:     'center',
            maxWidth:      420,
            width:         '100%',
          }}
        >
          {/* Green check disc */}
          <div
            style={{
              width:          60,
              height:         60,
              borderRadius:   16,
              background:     'var(--go-soft)',
              color:          'var(--go-ink)',
              border:         '1px solid color-mix(in oklab, var(--go) 30%, white)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              margin:         '0 auto 22px',
            }}
          >
            <CheckCircle2 size={30} />
          </div>

          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      30,
              fontWeight:    500,
              letterSpacing: '-0.02em',
              color:         'var(--ink)',
              margin:        '0 0 8px',
            }}
          >
            Thank you
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>
            Your review has been submitted. The team will be notified.
          </p>
        </div>
      </div>
    )
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── Branded header (no app topbar / sidebar) ──────────────── */}
      <header
        style={{
          background:   'var(--card)',
          borderBottom: '1px solid var(--hair)',
          padding:      '0',
        }}
      >
        <div
          style={{
            maxWidth:       680,
            margin:         '0 auto',
            padding:        '18px 24px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            16,
          }}
        >
          {/* Wordmark + label */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span
              style={{
                fontFamily:    'var(--serif)',
                fontSize:      24,
                fontWeight:    700,
                letterSpacing: '-0.03em',
                lineHeight:    1,
              }}
            >
              <span style={{ color: 'var(--a)' }}>W</span>
              <span style={{ color: 'var(--b)' }}>Y</span>
              <span style={{ color: 'var(--ink)' }}>R</span>
            </span>
            <span
              style={{
                fontFamily:    'var(--mono)',
                fontSize:      10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:         'var(--ink-3)',
              }}
            >
              Approval link
            </span>
          </div>

          {/* Security pill */}
          <span
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           5,
              fontFamily:    'var(--mono)',
              fontSize:      10,
              letterSpacing: '0.08em',
              background:    'var(--paper-2)',
              border:        '1px solid var(--hair-2)',
              borderRadius:  99,
              padding:       '4px 10px',
              color:         'var(--ink-3)',
              whiteSpace:    'nowrap',
            }}
          >
            <Lock size={10} />
            Secure · expires in 48h
          </span>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Centered title block */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
            {approvalType === 'ideas' ? 'Review ideas' : 'Review images'}
          </span>
          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      38,
              fontWeight:    500,
              letterSpacing: '-0.025em',
              color:         'var(--ink)',
              margin:        '0 0 8px',
              lineHeight:    1.1,
            }}
          >
            {approvalType === 'ideas' ? 'Approve the duels' : 'Pick your images'}
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, margin: 0 }}>
            Campaign —{' '}
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{theme}</span>
          </p>
        </div>

        {/* ── IDEAS mode ───────────────────────────────────────────── */}
        {approvalType === 'ideas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ideas.map((idea, i) => {
              const entry  = ideaStatuses[idea.id]
              const d      = entry?.status

              const borderColor =
                d === 'approved' ? 'color-mix(in oklab, var(--go) 35%, var(--hair))' :
                d === 'rejected' ? 'var(--a-line)' :
                'var(--hair)'

              return (
                <div
                  key={idea.id}
                  style={{
                    background:    'var(--card)',
                    border:        `1px solid ${borderColor}`,
                    borderRadius:  14,
                    boxShadow:     'var(--shadow-sm)',
                    overflow:      'hidden',
                    transition:    'border-color .2s',
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      padding:        '12px 18px',
                      borderBottom:   '1px solid var(--hair)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily:    'var(--mono)',
                        fontSize:      10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color:         'var(--ink-3)',
                      }}
                    >
                      <span style={{ color: 'var(--ink)', fontWeight: 700 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {'  '}Idea
                    </span>
                    {d && <DecisionBadge decision={d} />}
                  </div>

                  {/* Duel body: A | seam+VS | B */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr' }}>
                    {/* A side */}
                    <div style={{ padding: '18px 20px', background: 'var(--a-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <OptTag side="a" />
                      <div
                        style={{
                          fontFamily:    'var(--serif)',
                          fontSize:      17,
                          lineHeight:    1.4,
                          color:         'var(--ink)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {idea.option_a}
                      </div>
                    </div>

                    {/* Seam with centred VS disc */}
                    <div style={{ background: 'var(--hair-2)', position: 'relative', overflow: 'visible' }}>
                      <div
                        style={{
                          position:  'absolute',
                          top:       '50%',
                          left:      '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex:    4,
                        }}
                      >
                        <VS size={40} />
                      </div>
                    </div>

                    {/* B side */}
                    <div
                      style={{
                        padding:       '18px 20px',
                        background:    'var(--b-soft)',
                        textAlign:     'right',
                        display:       'flex',
                        flexDirection: 'column',
                        gap:           8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <OptTag side="b" align="right" />
                      </div>
                      <div
                        style={{
                          fontFamily:    'var(--serif)',
                          fontSize:      17,
                          lineHeight:    1.4,
                          color:         'var(--ink)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {idea.option_b}
                      </div>
                    </div>
                  </div>

                  {/* Footer: Approve / Reject buttons */}
                  <div
                    style={{
                      display:     'flex',
                      gap:         8,
                      padding:     '12px 18px',
                      borderTop:   '1px solid var(--hair)',
                    }}
                  >
                    <Button
                      variant={d === 'approved' ? 'go' : 'ghost'}
                      size="sm"
                      onClick={() =>
                        setIdeaStatuses(p => ({
                          ...p,
                          [idea.id]: { status: 'approved', comment: p[idea.id]?.comment ?? '' },
                        }))
                      }
                    >
                      <Check size={13} /> Approve
                    </Button>
                    <Button
                      variant={d === 'rejected' ? 'a' : 'ghost'}
                      size="sm"
                      onClick={() =>
                        setIdeaStatuses(p => ({
                          ...p,
                          [idea.id]: { status: 'rejected', comment: p[idea.id]?.comment ?? '' },
                        }))
                      }
                    >
                      <X size={13} /> Reject
                    </Button>
                  </div>

                  {/* Rejection note — shown when rejected */}
                  {d === 'rejected' && (
                    <div style={{ padding: '0 18px 16px' }}>
                      <textarea
                        placeholder="Optional note for the publisher…"
                        rows={2}
                        value={entry?.comment ?? ''}
                        onChange={e =>
                          setIdeaStatuses(p => ({
                            ...p,
                            [idea.id]: { ...p[idea.id], comment: e.target.value },
                          }))
                        }
                        style={{
                          width:        '100%',
                          boxSizing:    'border-box',
                          border:       '1.5px solid var(--a-line)',
                          borderRadius: 9,
                          padding:      '9px 12px',
                          fontFamily:   'var(--sans)',
                          fontSize:     13.5,
                          color:        'var(--ink)',
                          background:   'var(--paper)',
                          resize:       'vertical',
                          outline:      'none',
                          lineHeight:   1.5,
                          transition:   'border-color .14s',
                        }}
                        onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--a)')}
                        onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--a-line)')}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── IMAGES mode ──────────────────────────────────────────── */}
        {approvalType === 'images' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(['a', 'b'] as const).map(opt => {
              const imgs     = images[opt]
              const selected = opt === 'a' ? selectedImageA : selectedImageB
              const setSelected = opt === 'a' ? setSelectedImageA : setSelectedImageB
              const accent   = opt === 'a' ? 'var(--a)' : 'var(--b)'
              const accentSoft = opt === 'a' ? 'var(--a-soft)' : 'var(--b-soft)'
              const accentInk  = opt === 'a' ? 'var(--a-ink)' : 'var(--b-ink)'

              return (
                <div
                  key={opt}
                  style={{
                    background:    'var(--card)',
                    border:        `1px solid ${selected ? `color-mix(in oklab, ${accent} 35%, var(--hair))` : 'var(--hair)'}`,
                    borderRadius:  14,
                    boxShadow:     'var(--shadow-sm)',
                    overflow:      'hidden',
                    transition:    'border-color .2s',
                  }}
                >
                  {/* Section header */}
                  <div
                    style={{
                      display:     'flex',
                      alignItems:  'center',
                      gap:         10,
                      padding:     '13px 18px',
                      borderBottom: '1px solid var(--hair)',
                      background:  accentSoft,
                    }}
                  >
                    <span
                      style={{
                        width:          22,
                        height:         22,
                        borderRadius:   '50%',
                        background:     accent,
                        color:          '#fff',
                        display:        'inline-flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        fontSize:       11,
                        fontWeight:     700,
                        flexShrink:     0,
                      }}
                    >
                      {opt.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontFamily:    'var(--mono)',
                        fontSize:      10.5,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color:         accentInk,
                        fontWeight:    600,
                      }}
                    >
                      Option {opt.toUpperCase()} — pick your favourite
                    </span>
                    {selected && (
                      <span
                        style={{
                          marginLeft:  'auto',
                          display:     'inline-flex',
                          alignItems:  'center',
                          gap:         4,
                          color:       accentInk,
                          fontFamily:  'var(--mono)',
                          fontSize:    10,
                          fontWeight:  600,
                          letterSpacing: '0.08em',
                        }}
                      >
                        <CheckCircle2 size={12} /> Selected
                      </span>
                    )}
                  </div>

                  {/* Image grid */}
                  <div
                    style={{
                      display:             'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap:                 8,
                      padding:             16,
                    }}
                  >
                    {imgs.map((img: any) => {
                      const isSelected = selected === img.image_url
                      return (
                        <div
                          key={img.id}
                          onClick={() => setSelected(img.image_url)}
                          style={{
                            position:     'relative',
                            aspectRatio:  '1 / 1',
                            borderRadius: 9,
                            overflow:     'hidden',
                            cursor:       'pointer',
                            border:       `2px solid ${isSelected ? accent : 'transparent'}`,
                            boxShadow:    isSelected ? `0 0 0 2px ${accent}40` : 'none',
                            transition:   'all .14s',
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) (e.currentTarget as HTMLElement).style.border = `2px solid ${accent}70`
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) (e.currentTarget as HTMLElement).style.border = '2px solid transparent'
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.thumbnail_url || img.image_url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          {/* Selected tint + check */}
                          {isSelected && (
                            <>
                              <div
                                style={{
                                  position:      'absolute',
                                  inset:         0,
                                  background:    accent,
                                  opacity:       0.18,
                                  pointerEvents: 'none',
                                }}
                              />
                              <div
                                style={{
                                  position:       'absolute',
                                  inset:          0,
                                  display:        'flex',
                                  alignItems:     'center',
                                  justifyContent: 'center',
                                  pointerEvents:  'none',
                                }}
                              >
                                <span
                                  style={{
                                    width:          26,
                                    height:         26,
                                    borderRadius:   '50%',
                                    background:     accent,
                                    display:        'flex',
                                    alignItems:     'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Check size={14} color="#fff" strokeWidth={2.5} />
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Submit CTA ───────────────────────────────────────────── */}
        <Button
          variant="ink"
          size="lg"
          onClick={submitApproval}
          disabled={loading || !allDecided}
          style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}
        >
          {loading
            ? 'Submitting…'
            : allDecided
              ? 'Submit Review'
              : `Decide on all ${ideas.length} to submit`}
        </Button>

      </div>
    </div>
  )
}
