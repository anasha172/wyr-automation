'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Check, CheckCircle2, XCircle, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
import { VS } from '@/components/vs'
import { Button } from './ui/button'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WyrIdea {
  id: string
  title?: string
  option_a: string
  option_b: string
  why_it_works?: string
  approval_status: 'pending' | 'approved' | 'rejected'
  sent_to_manager?: boolean
  manager_comment?: string
}

export interface WyrIdeaCardProps {
  idea:          WyrIdea
  index:         number
  onUpdate:      (id: string, option_a: string, option_b: string) => void
  onRegenerate:  (id: string) => void
  loading?:      boolean
  readOnly?:     boolean
  selectable?:   boolean
  selected?:     boolean
  onSelect?:     (id: string, selected: boolean) => void
  role?:         string
  onApprove?:    (id: string) => void
  onReject?:     (id: string) => void
  managerName?:  string   // resolved full name of assigned_manager_id
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({
  status, sent, managerName,
}: {
  status:       WyrIdea['approval_status']
  sent:         boolean
  managerName?: string
}) {
  if (status === 'approved') {
    return (
      <span
        style={{
          display:    'inline-flex',
          alignItems: 'center',
          gap:        6,
          color:      'var(--go-ink)',
          fontWeight: 600,
          fontSize:   13,
        }}
      >
        <CheckCircle2 size={15} />
        Approved{managerName ? <span style={{ fontWeight: 400, color: 'var(--go-ink)', opacity: 0.8 }}>by {managerName}</span> : null}
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span
        style={{
          display:    'inline-flex',
          alignItems: 'center',
          gap:        6,
          color:      'var(--a-ink)',
          fontWeight: 600,
          fontSize:   13,
        }}
      >
        <XCircle size={15} />
        Rejected{managerName ? <span style={{ fontWeight: 400, color: 'var(--a-ink)', opacity: 0.8 }}>by {managerName}</span> : null}
      </span>
    )
  }

  if (sent) {
    return (
      <span
        style={{
          display:    'inline-flex',
          alignItems: 'center',
          gap:        6,
          color:      'var(--pending)',
          fontWeight: 600,
          fontSize:   13,
        }}
      >
        {/* Pulsing dot — animate-pulse via className */}
        <span
          className="animate-pulse"
          style={{
            width:        7,
            height:       7,
            borderRadius: '50%',
            background:   'var(--pending)',
            flexShrink:   0,
            display:      'inline-block',
          }}
        />
        Awaiting{managerName ? <span style={{ fontWeight: 400, opacity: 0.8 }}> · {managerName}</span> : ' manager'}
      </span>
    )
  }

  // Draft
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           6,
        fontFamily:    'var(--mono)',
        fontSize:      11,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color:         'var(--ink-3)',
      }}
    >
      <Clock size={13} />
      Draft
    </span>
  )
}

// ─── OptTag — A or B label pill ──────────────────────────────────────────────

function OptTag({
  side, align = 'left',
}: {
  side: 'a' | 'b'
  align?: 'left' | 'right'
}) {
  const dotBg  = side === 'a' ? 'var(--a)' : 'var(--b)'
  const textCol = side === 'a' ? 'var(--a-ink)' : 'var(--b-ink)'
  const label  = side === 'a' ? 'Option A' : 'Option B'
  const letter = side === 'a' ? 'A' : 'B'

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
        color:         textCol,
        marginBottom:  14,
      }}
    >
      {/* Coloured dot badge: A / B */}
      <span
        style={{
          width:          18,
          height:         18,
          borderRadius:   '50%',
          background:     dotBg,
          color:          '#fff',
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       10,
          fontWeight:     700,
          flexShrink:     0,
        }}
      >
        {letter}
      </span>
      {label}
    </span>
  )
}

// ─── EditableOpt — contentEditable serif option text ─────────────────────────

function EditableOpt({
  value, side, readOnly, onChange,
}: {
  value:    string
  side:     'a' | 'b'
  readOnly: boolean
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Sync external value changes (e.g. after regeneration) into the DOM
  useEffect(() => {
    const el = ref.current
    if (el && el.textContent !== value) {
      el.textContent = value
    }
  }, [value])

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={e => {
        const v = e.currentTarget.textContent?.trim() ?? ''
        if (v !== value) onChange(v)
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      title={readOnly ? undefined : 'Click to edit'}
      style={{
        fontFamily:    'var(--serif)',
        fontSize:      19,
        fontWeight:    400,
        lineHeight:    1.45,
        color:         'var(--ink)',
        letterSpacing: '-0.01em',
        outline:       'none',
        cursor:        readOnly ? 'default' : 'text',
        borderRadius:  4,
        textAlign:     side === 'b' ? 'right' : 'left',
        minHeight:     '3em',
      }}
    >
      {value}
    </div>
  )
}

// ─── WyrIdeaCard ─────────────────────────────────────────────────────────────

export function WyrIdeaCard({
  idea, index, onUpdate, onRegenerate, loading,
  readOnly, selectable, selected, onSelect,
  role, onApprove, onReject, managerName,
}: WyrIdeaCardProps) {
  const [optionA, setOptionA] = useState(idea.option_a)
  const [optionB, setOptionB] = useState(idea.option_b)

  const isManager = role === 'manager' || role === 'admin'

  // Track external changes from parent (e.g. after regeneration)
  useEffect(() => {
    if (idea.option_a !== optionA) setOptionA(idea.option_a)
    if (idea.option_b !== optionB) setOptionB(idea.option_b)
  }, [idea.option_a, idea.option_b])   // eslint-disable-line react-hooks/exhaustive-deps

  const isDraft    = !idea.sent_to_manager && idea.approval_status === 'pending'
  const isSent     = !!idea.sent_to_manager
  const isApproved = idea.approval_status === 'approved'
  const isRejected = idea.approval_status === 'rejected'

  // Read-only when approved, or when it's been sent (awaiting manager)
  const isReadOnly = !!(readOnly || isApproved || isSent)

  // ── Card border colour ──────────────────────────────────────
  const borderColor =
    isApproved ? 'color-mix(in oklab, var(--go) 35%, var(--hair))' :
    isRejected ? 'var(--a-line)' :
    selected   ? 'var(--ink)' :
    'var(--hair)'

  function handleEdit(field: 'a' | 'b', v: string) {
    if (field === 'a') {
      setOptionA(v)
      onUpdate(idea.id, v, optionB)
    } else {
      setOptionB(v)
      onUpdate(idea.id, optionA, v)
    }
  }

  return (
    <div
      style={{
        border:       `1px solid ${borderColor}`,
        borderRadius: 14,
        overflow:     'hidden',
        transition:   'border-color .2s',
        background:   'var(--card)',
      }}
    >
      {/* ── Card header ──────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '13px 18px',
          borderBottom:   '1px solid var(--hair)',
        }}
      >
        {/* Left: [checkbox] + eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Draft checkbox (publisher only) */}
          {isDraft && selectable && onSelect && !isManager && (
            <button
              type="button"
              onClick={() => onSelect(idea.id, !selected)}
              title={selected ? 'Deselect' : 'Select to send to manager'}
              style={{
                width:          20,
                height:         20,
                borderRadius:   6,
                border:         `1.5px solid ${selected ? 'var(--ink)' : 'var(--hair-2)'}`,
                background:     selected ? 'var(--ink)' : 'transparent',
                color:          'var(--paper)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                cursor:         'pointer',
                flexShrink:     0,
                transition:     'all .14s',
              }}
            >
              {selected && <Check size={13} strokeWidth={2.5} />}
            </button>
          )}

          {/* Mono eyebrow: "01  Idea" */}
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
              {String(index + 1).padStart(2, '0')}
            </span>
            {'  '}
            Idea
          </span>
        </div>

        {/* Right: status + manager btns OR regen btn */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={idea.approval_status} sent={isSent} managerName={managerName} />

          {/* Manager approve / reject — shown when pending and sent */}
          {isManager && idea.approval_status === 'pending' && isSent && (
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                variant="go"
                size="sm"
                onClick={() => onApprove?.(idea.id)}
              >
                <ThumbsUp size={13} />
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReject?.(idea.id)}
              >
                <ThumbsDown size={13} />
                Reject
              </Button>
            </div>
          )}

          {/* Regenerate — shown for publisher when not approved */}
          {!isManager && !isApproved && !readOnly && !isSent && (
            <button
              type="button"
              onClick={() => onRegenerate(idea.id)}
              disabled={loading}
              title="Regenerate this idea"
              style={{
                width:        32,
                height:       32,
                borderRadius: 8,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                background:   'transparent',
                border:       '1px solid var(--hair-2)',
                color:        'var(--ink-3)',
                cursor:       loading ? 'not-allowed' : 'pointer',
                transition:   'all .14s',
                flexShrink:   0,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.color       = 'var(--ink)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)'
                  ;(e.currentTarget as HTMLElement).style.background  = 'var(--paper-2)'
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color       = 'var(--ink-3)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--hair-2)'
                ;(e.currentTarget as HTMLElement).style.background  = 'transparent'
              }}
            >
              <RefreshCw
                size={15}
                style={{ animation: loading ? 'spin .7s linear infinite' : 'none' }}
              />
            </button>
          )}
        </div>
      </div>

      {/* ── Duel body: A | seam | B ──────────────────────────── */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1px 1fr',
        }}
      >
        {/* A side */}
        <div
          style={{
            padding:    '18px 20px',
            background: 'var(--a-soft)',
          }}
        >
          <OptTag side="a" />
          <EditableOpt
            value={optionA}
            side="a"
            readOnly={isReadOnly}
            onChange={v => handleEdit('a', v)}
          />
        </div>

        {/* Centre seam — 1px hairline with VS disc centred */}
        <div
          style={{
            background: 'var(--hair-2)',
            position:   'relative',
            overflow:   'visible',
          }}
        >
          <div
            style={{
              position:  'absolute',
              top:       '50%',
              left:      '50%',
              transform: 'translate(-50%, -50%)',
              zIndex:    4,
            }}
          >
            <VS size={44} />
          </div>
        </div>

        {/* B side */}
        <div
          style={{
            padding:    '18px 20px',
            background: 'var(--b-soft)',
            textAlign:  'right',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <OptTag side="b" align="right" />
          </div>
          <EditableOpt
            value={optionB}
            side="b"
            readOnly={isReadOnly}
            onChange={v => handleEdit('b', v)}
          />
        </div>
      </div>

      {/* ── Why it works note (optional) ─────────────────────── */}
      {idea.why_it_works && (
        <div
          style={{
            padding:    '10px 18px',
            borderTop:  '1px solid var(--hair)',
            background: 'var(--paper-2)',
            display:    'flex',
            gap:        8,
            alignItems: 'flex-start',
          }}
        >
          <span
            style={{
              fontFamily:    'var(--mono)',
              fontSize:      10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         'var(--ink-3)',
              flexShrink:    0,
              marginTop:     2,
            }}
          >
            Why
          </span>
          <p style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
            {idea.why_it_works}
          </p>
        </div>
      )}

      {/* ── Manager comment (optional) ────────────────────────── */}
      {idea.manager_comment && !idea.manager_comment.startsWith('{') && (
        <div
          style={{
            padding:    '8px 18px',
            borderTop:  '1px solid var(--hair)',
            background: 'var(--paper-2)',
            fontSize:   12.5,
            color:      'var(--ink-3)',
            fontStyle:  'italic',
          }}
        >
          Manager: {idea.manager_comment}
        </div>
      )}
    </div>
  )
}
