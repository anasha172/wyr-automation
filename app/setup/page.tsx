'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Hash, ArrowRight, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default function SetupPage() {
  const router  = useRouter()
  const user    = useUser()
  const [slackId,  setHashId]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [checking, setChecking] = useState(true)

  // Only managers need Slack setup — admins and publishers redirect away
  useEffect(() => {
    if (user === undefined) return // still hydrating
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'manager') { router.replace('/'); return }

    // Check if slack_user_id already saved
    const supabase = createClient()
    supabase
      .from('user_settings')
      .select('slack_user_id')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.slack_user_id) router.replace('/')
        else setChecking(false)
      })
  }, [user, router])

  async function save() {
    const trimmed = slackId.trim()
    if (!trimmed) return toast.error('Please enter your Hash User ID')
    if (!trimmed.startsWith('U')) return toast.error('Hash User IDs start with "U" — e.g. U0123456789')
    if (!user) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, slack_user_id: trimmed })

      if (error) throw error

      toast.success('Hash connected! Taking you to the dashboard…')
      router.replace('/')
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  if (checking || user === undefined) return null

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
          width:        440,
          background:   'var(--card)',
          border:       '1px solid var(--hair)',
          borderRadius: 16,
          boxShadow:    'var(--shadow)',
          overflow:     'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background:   'var(--ink)',
            padding:      '28px 32px',
            textAlign:    'center',
          }}
        >
          <div
            style={{
              width:          52,
              height:         52,
              borderRadius:   14,
              background:     'rgba(251,250,247,0.1)',
              border:         '1px solid rgba(251,250,247,0.15)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              margin:         '0 auto 16px',
              color:          'var(--paper)',
            }}
          >
            <Hash size={26} />
          </div>

          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      26,
              fontWeight:    500,
              letterSpacing: '-0.02em',
              color:         'var(--paper)',
              margin:        '0 0 6px',
            }}
          >
            One quick step, {user?.full_name?.split(' ')[0] ?? 'there'}.
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(251,250,247,0.6)', margin: 0 }}>
            Connect Hash so publishers can send you approval requests directly.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>

          {/* Field */}
          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display:       'block',
                fontFamily:    'var(--mono)',
                fontSize:      10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:         'var(--ink-3)',
                marginBottom:  8,
              }}
            >
              Your Hash User ID
            </label>
            <input
              type="text"
              value={slackId}
              onChange={e => setHashId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="U0123456789"
              style={{
                width:        '100%',
                boxSizing:    'border-box',
                padding:      '11px 14px',
                fontFamily:   'var(--mono)',
                fontSize:     15,
                letterSpacing:'0.05em',
                color:        'var(--ink)',
                background:   'var(--paper)',
                border:       '1.5px solid var(--hair-2)',
                borderRadius: 10,
                outline:      'none',
                transition:   'border-color .14s, box-shadow .14s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--ink)'
                e.target.style.boxShadow   = '0 0 0 3px color-mix(in oklab, var(--ink) 8%, transparent)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--hair-2)'
                e.target.style.boxShadow   = 'none'
              }}
            />
          </div>

          {/* How to find it */}
          <div
            style={{
              padding:      '12px 14px',
              background:   'var(--paper-2)',
              border:       '1px solid var(--hair)',
              borderRadius: 10,
              marginBottom: 22,
            }}
          >
            <p
              style={{
                fontFamily:    'var(--mono)',
                fontSize:      10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color:         'var(--ink-3)',
                margin:        '0 0 6px',
              }}
            >
              How to find your Hash User ID
            </p>
            <ol
              style={{
                fontSize:   13,
                color:      'var(--ink-2)',
                margin:     0,
                paddingLeft: 18,
                lineHeight: 1.7,
              }}
            >
              <li>Open Hash and click your profile photo</li>
              <li>Click <strong>Profile</strong></li>
              <li>Click the <strong>⋮</strong> (more) menu</li>
              <li>Click <strong>Copy member ID</strong></li>
            </ol>
            <a
              href="https://slack.com/help/articles/360003827751"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            4,
                fontSize:       12,
                color:          'var(--ink-3)',
                marginTop:      8,
                textDecoration: 'none',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-3)')}
            >
              <ExternalLink size={11} />
              Hash help article
            </a>
          </div>

          <Button
            variant="ink"
            size="lg"
            onClick={save}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Saving…' : 'Connect Hash & Continue'}
            {!loading && <ArrowRight size={16} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
