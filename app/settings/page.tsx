'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { useUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Save, Mail, Camera,
  CheckCircle2, Lock,
  Sheet, Copy, Check,
} from 'lucide-react'
import { LinkedInIcon } from '@/components/linkedin/linkedin-icon'

interface Settings {
  manager_email:          string
  instagram_user_id:      string
  instagram_access_token: string
}

const DEFAULTS: Settings = {
  manager_email:          '',
  instagram_user_id:      '',
  instagram_access_token: '',
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

// ─── EnvBlock — copy-able env var snippet ────────────────────────────────────

function EnvBlock({ vars }: { vars: { key: string; placeholder: string; note?: string }[] }) {
  const [copied, setCopied] = useState(false)
  const text = vars.map(v => `${v.key}=your_${v.key.toLowerCase()}_here`).join('\n')

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      style={{
        position:     'relative',
        background:   'var(--paper-2)',
        border:       '1px solid var(--hair)',
        borderRadius: 9,
        padding:      '14px 16px',
        marginTop:    4,
      }}
    >
      {vars.map(v => (
        <div key={v.key} style={{ marginBottom: 6 }}>
          <code style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>
            <span style={{ color: 'var(--b-ink)' }}>{v.key}</span>
            <span style={{ color: 'var(--ink-3)' }}>=</span>
            <span style={{ color: 'var(--ink-2)' }}>…</span>
          </code>
          {v.note && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 10 }}>
              # {v.note}
            </span>
          )}
        </div>
      ))}
      <button
        onClick={copy}
        style={{
          position:    'absolute',
          top:         10,
          right:       10,
          display:     'flex',
          alignItems:  'center',
          gap:         4,
          fontFamily:  'var(--mono)',
          fontSize:    10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          border:      '1px solid var(--hair-2)',
          borderRadius: 6,
          padding:     '4px 8px',
          background:  'var(--card)',
          cursor:      'pointer',
          color:       copied ? 'var(--go-ink)' : 'var(--ink-3)',
          transition:  'color .14s',
        }}
      >
        {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const user      = useUser()
  const role      = user?.role ?? 'publisher'
  const isAdmin   = role === 'admin'

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

            {/* Google Sheets */}
            <SettingsCard
              icon={<Sheet size={17} />}
              title="Google Sheets"
              description="Source for LinkedIn job listings"
              connected={false}
            >
              <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
                Add these to your <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--paper-2)', padding: '1px 5px', borderRadius: 4 }}>.env.local</code> file:
              </p>
              <EnvBlock vars={[
                { key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL', placeholder: '', note: 'e.g. bot@project.iam.gserviceaccount.com' },
                { key: 'GOOGLE_SERVICE_ACCOUNT_KEY',   placeholder: '', note: 'base64-encoded PEM private key' },
                { key: 'GOOGLE_SHEET_ID',              placeholder: '', note: 'from the sheet URL' },
                { key: 'GOOGLE_SHEET_TAB',             placeholder: '', note: 'tab name, e.g. Jobs' },
              ]} />
              <div
                style={{
                  padding:      '10px 14px',
                  borderRadius: 9,
                  background:   'var(--b-soft)',
                  border:       '1px solid var(--b-line)',
                  fontSize:     12.5,
                  color:        'var(--b-ink)',
                  lineHeight:   1.6,
                }}
              >
                <strong>Sheet setup:</strong> Columns A–K must be:{' '}
                Company, Title, Description, Location, Job Type, Country, City, Link, Requirement 1, Requirement 2, Status.
                Share the sheet with your service account email (Viewer or Editor).
              </div>
            </SettingsCard>

            {/* LinkedIn */}
            <SettingsCard
              icon={<LinkedInIcon size={17} />}
              title="LinkedIn"
              description="Required to post carousels"
              connected={false}
            >
              <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
                Add these to your <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--paper-2)', padding: '1px 5px', borderRadius: 4 }}>.env.local</code> file:
              </p>
              <EnvBlock vars={[
                { key: 'LINKEDIN_ACCESS_TOKEN', placeholder: '', note: 'OAuth 2.0 — scopes: w_member_social, w_organization_social' },
                { key: 'LINKEDIN_PERSON_URN',   placeholder: '', note: 'urn:li:person:XXXXXXX' },
                { key: 'LINKEDIN_ORG_URN',      placeholder: '', note: 'urn:li:organization:XXXXXXX (company page)' },
              ]} />
              <div
                style={{
                  padding:      '10px 14px',
                  borderRadius: 9,
                  background:   'var(--pending-soft)',
                  border:       '1px solid color-mix(in oklab, var(--pending) 30%, white)',
                  fontSize:     12.5,
                  color:        'var(--ink-2)',
                  lineHeight:   1.6,
                }}
              >
                Get your token from the{' '}
                <a
                  href="https://www.linkedin.com/developers/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--b-ink)', fontWeight: 600 }}
                >
                  LinkedIn Developer Portal
                </a>
                {' '}→ your app → OAuth 2.0 tools → Generate access token.
              </div>
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
