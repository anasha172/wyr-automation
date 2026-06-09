'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { useUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Save, Mail, Camera,
  CheckCircle2, Hash, Lock,
} from 'lucide-react'

interface Settings {
  manager_email:          string
  instagram_user_id:      string
  instagram_access_token: string
  slack_user_id:          string
}

const DEFAULTS: Settings = {
  manager_email:          '',
  instagram_user_id:      '',
  instagram_access_token: '',
  slack_user_id:          '',
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────

function FieldLabel({ children, description }: { children: React.ReactNode; description?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label
        style={{
          display:       'block',
          fontFamily:    'var(--mono)',
          fontSize:      10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color:         'var(--ink-3)',
          marginBottom:  description ? 4 : 6,
        }}
      >
        {children}
      </label>
      {description && (
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 6px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
    </div>
  )
}

// ─── StyledInput ──────────────────────────────────────────────────────────────

function StyledInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width:        '100%',
        boxSizing:    'border-box',
        border:       '1.5px solid var(--hair-2)',
        borderRadius: 9,
        padding:      '9px 12px',
        fontFamily:   'var(--sans)',
        fontSize:     14,
        color:        'var(--ink)',
        background:   'var(--paper)',
        outline:      'none',
        transition:   'border-color .14s',
      }}
      onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)')}
      onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--hair-2)')}
    />
  )
}

// ─── SettingsCard ─────────────────────────────────────────────────────────────

function SettingsCard({
  icon, title, description, connected, children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  connected: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background:    'var(--card)',
        border:        '1px solid var(--hair)',
        borderRadius:  14,
        boxShadow:     'var(--shadow-sm)',
        overflow:      'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         14,
          padding:     '15px 20px',
          borderBottom: '1px solid var(--hair)',
        }}
      >
        {/* Icon box */}
        <div
          style={{
            width:          34,
            height:         34,
            borderRadius:   9,
            background:     'var(--ink)',
            color:          'var(--paper)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          {icon}
        </div>

        {/* Title + desc */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>{description}</div>
        </div>

        {/* Connected pill */}
        <span
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           5,
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.08em',
            padding:       '5px 10px',
            borderRadius:  8,
            background:    connected ? 'var(--go-soft)' : 'var(--paper-2)',
            border:        connected ? '1px solid color-mix(in oklab, var(--go) 30%, white)' : '1px solid var(--hair-2)',
            color:         connected ? 'var(--go-ink)' : 'var(--ink-3)',
            flexShrink:    0,
          }}
        >
          <CheckCircle2 size={11} />
          {connected ? 'Connected' : 'Not set'}
        </span>
      </div>

      {/* Card body */}
      <div
        style={{
          padding:       '18px 20px',
          display:       'flex',
          flexDirection: 'column',
          gap:           16,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, description, children,
}: {
  label: string; description?: string; children: React.ReactNode
}) {
  return (
    <div>
      <FieldLabel description={description}>{label}</FieldLabel>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const user      = useUser()
  const role      = user?.role ?? 'publisher'
  const isAdmin   = role === 'admin'
  const isManager = role === 'manager'

  const [settings,     setSettings]     = useState<Settings>(DEFAULTS)
  const [loading,      setLoading]      = useState(false)
  const [newPassword,  setNewPassword]  = useState('')
  const [confirmPwd,   setConfirmPwd]   = useState('')
  const [pwdLoading,   setPwdLoading]   = useState(false)

  useEffect(() => {
    if (isDemoMode) {
      const saved = demoStore.settings.get()
      if (saved) setSettings({ ...DEFAULTS, ...saved })
    } else {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase.from('user_settings').select('*').eq('user_id', user.id).single()
          .then(({ data }) => { if (data) setSettings({ ...DEFAULTS, ...data }) })
      })
    }
  }, [])

  async function save() {
    setLoading(true)
    try {
      if (isDemoMode) {
        demoStore.settings.save(settings as any)
        toast.success('Settings saved locally!')
      } else {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('user_settings').upsert({ ...settings, user_id: user?.id })
        if (error) throw error
        toast.success('Settings saved!')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  function set(key: keyof Settings) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setSettings(s => ({ ...s, [key]: e.target.value }))
  }

  async function changePassword() {
    if (!newPassword) return toast.error('Enter a new password.')
    if (newPassword !== confirmPwd) return toast.error('Passwords do not match.')
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters.')
    setPwdLoading(true)
    try {
      if (isDemoMode) {
        toast.success('Demo: Password updated!')
      } else {
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
        toast.success('Password updated!')
      }
      setNewPassword('')
      setConfirmPwd('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPwdLoading(false)
    }
  }

  const connected = (val: string) => (val ?? '').trim().length > 0

  return (
    <div>
      {/* ── Page masthead ───────────────────────────────── */}
      <div
        style={{
          background:   'var(--card)',
          borderBottom: '1px solid var(--hair)',
          padding:      '24px 40px',
        }}
      >
        <span
          style={{
            display:       'block',
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
            marginBottom:  8,
          }}
        >
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>06</span>
          {'  '}Configuration
        </span>
        <h1
          style={{
            fontFamily:    'var(--serif)',
            fontSize:      36,
            fontWeight:    500,
            letterSpacing: '-0.02em',
            color:         'var(--ink)',
            margin:        '0 0 4px',
            lineHeight:    1.1,
          }}
        >
          Settings
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, margin: 0 }}>
          Connect the services that power the pipeline.
        </p>
      </div>

      <div
        style={{
          padding:  '28px 40px 60px',
          maxWidth: 640,
          display:  'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Demo mode banner */}
        {isDemoMode && (
          <div
            style={{
              padding:      '12px 16px',
              background:   'var(--pending-soft)',
              border:       '1px solid color-mix(in oklab, var(--pending) 30%, white)',
              borderRadius: 10,
              fontSize:     13.5,
            }}
          >
            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>Demo Mode is active</p>
            <p style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: 0 }}>
              Settings are stored in your browser only. Set{' '}
              <code
                style={{
                  fontFamily:   'var(--mono)',
                  background:   'var(--paper-2)',
                  padding:      '1px 5px',
                  borderRadius: 4,
                  fontSize:     11,
                }}
              >
                NEXT_PUBLIC_DEMO_MODE=false
              </code>{' '}
              to go live.
            </p>
          </div>
        )}

        {/* ── Password change — all roles ── */}
        <SettingsCard
          icon={<Lock size={17} />}
          title="Password"
          description="Change your login password"
          connected={false}
        >
          <Field label="New password">
            <StyledInput
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              type="password"
            />
          </Field>
          <Field label="Confirm new password">
            <StyledInput
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Repeat new password"
              type="password"
            />
          </Field>
          <Button variant="ink" onClick={changePassword} disabled={pwdLoading}>
            <Save size={14} />
            {pwdLoading ? 'Updating…' : 'Update password'}
          </Button>
        </SettingsCard>

        {/* ── Slack User ID — manager + admin ── */}
        {(isAdmin || isManager) && (
          <SettingsCard
            icon={<Hash size={17} />}
            title="Slack"
            description="Receive approval requests via Slack DM"
            connected={connected(settings.slack_user_id)}
          >
            <Field
              label="Your Slack User ID"
              description="Publishers will DM you approval requests. Find it: Slack → Profile → ⋮ → Copy member ID"
            >
              <StyledInput
                value={settings.slack_user_id}
                onChange={set('slack_user_id')}
                placeholder="U0123456789"
              />
            </Field>
            <Button variant="ink" onClick={save} disabled={loading}>
              <Save size={14} />
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </SettingsCard>
        )}

        {/* ── Admin-only settings ── */}
        {isAdmin && (
          <>
            {/* Notifications */}
            <SettingsCard
              icon={<Mail size={17} />}
              title="Notifications"
              description="Where approval requests are sent"
              connected={connected(settings.manager_email)}
            >
              <Field label="Manager email" description="Approval requests go to this address">
                <StyledInput
                  value={settings.manager_email}
                  onChange={set('manager_email')}
                  placeholder="manager@studio.co"
                  type="email"
                />
              </Field>
            </SettingsCard>

            {/* Instagram / Meta */}
            <SettingsCard
              icon={<Camera size={17} />}
              title="Instagram / Meta"
              description="Required to publish stories"
              connected={connected(settings.instagram_user_id) && connected(settings.instagram_access_token)}
            >
              <Field label="Instagram User ID">
                <StyledInput value={settings.instagram_user_id} onChange={set('instagram_user_id')} placeholder="17841400000000000" />
              </Field>
              <Field label="Access token" description="Business or Creator account linked to a Facebook Page">
                <StyledInput value={settings.instagram_access_token} onChange={set('instagram_access_token')} placeholder="EAAx…" type="password" />
              </Field>
            </SettingsCard>

            {/* Save all — admin only */}
            <Button variant="ink" size="lg" onClick={save} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              <Save size={16} />
              {loading ? 'Saving…' : 'Save all settings'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
