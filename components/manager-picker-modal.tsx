'use client'

import { useEffect, useState } from 'react'
import { X, Hash, Mail, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/avatar'
import type { ManagerInfo } from '@/app/api/managers/route'

interface ManagerPickerModalProps {
  open:      boolean
  onClose:   () => void
  onConfirm: (manager: ManagerInfo) => void
  sending?:  boolean
  title?:    string
}

export function ManagerPickerModal({
  open, onClose, onConfirm, sending = false, title = 'Send to Manager',
}: ManagerPickerModalProps) {
  const [managers,  setManagers]  = useState<ManagerInfo[]>([])
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelected(null)
    fetch('/api/managers')
      .then(r => r.json())
      .then(data => { setManagers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open])

  if (!open) return null

  const selectedManager = managers.find(m => m.id === selected) ?? null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed', inset: 0,
          background: 'rgba(26,24,21,0.45)',
          zIndex:     50,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position:      'fixed',
          top:           '50%',
          left:          '50%',
          transform:     'translate(-50%,-50%)',
          zIndex:        51,
          width:         420,
          background:    'var(--card)',
          border:        '1px solid var(--hair)',
          borderRadius:  16,
          boxShadow:     'var(--shadow-lg)',
          overflow:      'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '16px 20px',
            borderBottom:   '1px solid var(--hair)',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily:    'var(--serif)',
                fontSize:      20,
                fontWeight:    500,
                letterSpacing: '-0.02em',
                color:         'var(--ink)',
                margin:        0,
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '2px 0 0' }}>
              They'll receive a Slack DM with Approve / Reject buttons.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--hair-2)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--ink-3)', flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Manager list */}
        <div style={{ padding: '14px 20px', minHeight: 80 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)', fontSize: 13, padding: '12px 0' }}>
              <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} />
              Loading managers…
            </div>
          ) : managers.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '16px 0' }}>
              No managers found. Ask your admin to add one.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {managers.map(m => {
                const isSelected = selected === m.id
                const hasSlack   = !!m.slack_user_id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected(m.id)}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          12,
                      padding:      '12px 14px',
                      borderRadius: 10,
                      border:       `1.5px solid ${isSelected ? 'var(--ink)' : 'var(--hair-2)'}`,
                      background:   isSelected ? 'var(--ink)' : 'var(--card)',
                      cursor:       'pointer',
                      textAlign:    'left',
                      transition:   'all .14s',
                      width:        '100%',
                    }}
                  >
                    {/* Radio indicator */}
                    <span
                      style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: isSelected
                          ? '5px solid var(--paper)'
                          : '1.5px solid var(--hair-2)',
                        background: isSelected ? 'transparent' : 'transparent',
                        display: 'block',
                      }}
                    />

                    <Avatar name={m.full_name} role="manager" size={32} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600, fontSize: 14,
                          color: isSelected ? 'var(--paper)' : 'var(--ink)',
                        }}
                      >
                        {m.full_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12, marginTop: 1,
                          color: isSelected ? 'rgba(251,250,247,0.65)' : 'var(--ink-3)',
                          fontFamily: 'var(--mono)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {m.email}
                      </div>
                    </div>

                    {/* Slack / Email badge */}
                    <span
                      style={{
                        display:    'inline-flex',
                        alignItems: 'center',
                        gap:        4,
                        fontSize:   10,
                        fontFamily: 'var(--mono)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding:    '3px 8px',
                        borderRadius: 5,
                        flexShrink: 0,
                        background: isSelected
                          ? 'rgba(251,250,247,0.12)'
                          : hasSlack ? 'var(--go-soft)' : 'var(--paper-2)',
                        color: isSelected
                          ? 'rgba(251,250,247,0.8)'
                          : hasSlack ? 'var(--go-ink)' : 'var(--ink-3)',
                        border: '1px solid transparent',
                      }}
                    >
                      {hasSlack
                        ? <><Hash size={10} /> Slack</>
                        : <><Mail size={10} /> Email</>
                      }
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'flex-end',
            gap:            10,
            padding:        '14px 20px',
            borderTop:      '1px solid var(--hair)',
          }}
        >
          <Button variant="ghost" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="a"
            disabled={!selectedManager || sending}
            onClick={() => selectedManager && onConfirm(selectedManager)}
          >
            {sending
              ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} />Sending…</>
              : <><Send size={14} />Send</>
            }
          </Button>
        </div>
      </div>
    </>
  )
}
