'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, ChevronRight, LogOut, Settings, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/auth'
import Link from 'next/link'
import { Avatar } from '@/components/avatar'

// ─── Breadcrumb derivation ────────────────────────────────────────────────────

interface Crumb { label: string; href?: string }

function getBreadcrumbs(pathname: string): Crumb[] {
  // Root
  if (pathname === '/')               return [{ label: 'Dashboard' }]
  if (pathname === '/campaigns')      return [{ label: 'Dashboard', href: '/' }, { label: 'Campaigns' }]
  if (pathname === '/campaigns/new')  return [{ label: 'Dashboard', href: '/' }, { label: 'Campaigns', href: '/campaigns' }, { label: 'New Campaign' }]
  if (pathname === '/manager')        return [{ label: 'Dashboard', href: '/' }, { label: 'Manager Overview' }]
  if (pathname === '/settings')       return [{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]
  if (pathname.startsWith('/admin'))  return [{ label: 'Dashboard', href: '/' }, { label: 'Admin' }, { label: 'Users' }]

  // Campaign flow pages — /campaigns/[id]/step
  if (pathname.includes('/campaigns/')) {
    const base: Crumb[] = [{ label: 'Dashboard', href: '/' }, { label: 'Campaigns', href: '/campaigns' }]
    if (pathname.includes('/ideas'))   return [...base, { label: 'Ideas' }]
    if (pathname.includes('/images'))  return [...base, { label: 'Images' }]
    if (pathname.includes('/design'))  return [...base, { label: 'Stories' }]
    if (pathname.includes('/publish')) return [...base, { label: 'Publish' }]
  }

  return [{ label: 'WYR Studio' }]
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function GlobalHeader({ pendingCount = 0 }: { pendingCount?: number }) {
  const router   = useRouter()
  const pathname = usePathname()
  const user     = useUser()
  const role     = user?.role ?? 'publisher'
  const crumbs   = getBreadcrumbs(pathname)

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function signOut() {
    setOpen(false)
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="flex items-center gap-4 flex-shrink-0 sticky top-0 z-10"
      style={{
        height:       60,
        padding:      '0 28px',
        borderBottom: '1px solid var(--hair)',
        // Frosted glass — wyr.css .topbar
        background:   'color-mix(in oklab, var(--paper) 86%, transparent)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <nav
        className="flex items-center gap-[9px]"
        style={{ fontSize: 13, color: 'var(--ink-3)', flex: 1, minWidth: 0 }}
        aria-label="Breadcrumb"
      >
        {/* Static app-name prefix — muted mono, no chevron after it */}
        <span
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
            flexShrink:    0,
          }}
        >
          WYR
        </span>
        <ChevronRight size={12} aria-hidden="true" style={{ color: 'var(--hair-2)', flexShrink: 0 }} />
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <span key={i} className="flex items-center gap-[9px] min-w-0">
              {i > 0 && (
                <ChevronRight
                  size={12}
                  aria-hidden="true"
                  style={{ color: 'var(--hair-2)', flexShrink: 0 }}
                />
              )}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="transition-colors truncate"
                  style={{ color: 'var(--ink-3)' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--ink)')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--ink-3)')}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="truncate"
                  style={{
                    color:      isLast ? 'var(--ink)' : 'var(--ink-3)',
                    fontWeight: isLast ? 600 : undefined,
                  }}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>

      {/* ── Right controls ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Bell — wyr.css .icon-btn + .dot-badge */}
        <button
          className="relative flex items-center justify-center rounded-[9px] border border-transparent transition-all"
          style={{
            width:   38,
            height:  38,
            color:   'var(--ink-2)',
            background: 'transparent',
            cursor:  'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background    = 'var(--paper-2)'
            ;(e.currentTarget as HTMLElement).style.borderColor  = 'var(--hair)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background    = 'transparent'
            ;(e.currentTarget as HTMLElement).style.borderColor  = 'transparent'
          }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span
              className="absolute rounded-full"
              style={{
                top:         8,
                right:       9,
                width:       7,
                height:      7,
                background:  'var(--a)',
                border:      '1.5px solid var(--paper)',
              }}
            />
          )}
        </button>

        {/* ── User menu ──────────────────────────────────────────── */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 rounded-[9px] border transition-all"
            style={{
              padding:     '6px 10px 6px 6px',
              background:  open ? 'var(--paper-2)' : 'transparent',
              borderColor: open ? 'var(--hair)'    : 'transparent',
              cursor:      'pointer',
            }}
            onMouseEnter={e => {
              if (!open) {
                (e.currentTarget as HTMLElement).style.background   = 'var(--paper-2)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--hair)'
              }
            }}
            onMouseLeave={e => {
              if (!open) {
                (e.currentTarget as HTMLElement).style.background   = 'transparent'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
              }
            }}
          >
            <Avatar
              name={user?.full_name || user?.email}
              role={role}
              size={28}
            />

            {/* Name + role — hidden on very small screens */}
            <div className="text-left hidden sm:block" style={{ maxWidth: 130 }}>
              <p
                className="truncate leading-tight"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}
              >
                {user === undefined ? '…' : user?.full_name || user?.email || '—'}
              </p>
              <p
                className="leading-tight"
                style={{
                  fontFamily:    'var(--mono)',
                  fontSize:      10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color:         'var(--ink-3)',
                }}
              >
                {role}
              </p>
            </div>

            <ChevronRight
              size={13}
              className={`transition-transform ${open ? 'rotate-90' : ''}`}
              style={{ color: 'var(--ink-3)' }}
            />
          </button>

          {/* ── Dropdown ─────────────────────────────────────────── */}
          {open && (
            <div
              className="absolute right-0 top-full mt-1.5 overflow-hidden z-50"
              style={{
                width:        220,
                background:   'var(--card)',
                border:       '1px solid var(--hair)',
                borderRadius: 12,
                boxShadow:    'var(--shadow)',
              }}
            >
              {/* User info header */}
              <div
                style={{
                  padding:      '14px 16px 12px',
                  borderBottom: '1px solid var(--hair)',
                  background:   'var(--paper-2)',
                }}
              >
                <p
                  className="truncate"
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}
                >
                  {user?.full_name || '—'}
                </p>
                <p
                  className="truncate mt-0.5"
                  style={{ fontSize: 12, color: 'var(--ink-3)' }}
                >
                  {user?.email}
                </p>
                {/* Role pill */}
                <span
                  className="inline-block mt-2"
                  style={{
                    fontFamily:    'var(--mono)',
                    fontSize:      9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding:       '2px 7px',
                    borderRadius:  5,
                    border:        '1px solid var(--hair-2)',
                    color:         role === 'admin' ? 'var(--a-ink)' : role === 'manager' ? 'var(--b-ink)' : 'var(--ink-3)',
                    background:    role === 'admin' ? 'var(--a-soft)' : role === 'manager' ? 'var(--b-soft)' : 'var(--paper-2)',
                  }}
                >
                  {role}
                </span>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 0' }}>
                {role === 'admin' && (
                  <>
                    <DropItem href="/admin/users" icon={<Users size={14} />} label="User Management" onClick={() => setOpen(false)} />
                    <DropItem href="/settings"    icon={<Settings size={14} />} label="Global Settings" onClick={() => setOpen(false)} />
                    <div style={{ height: 1, background: 'var(--hair)', margin: '6px 0' }} />
                  </>
                )}
                {role !== 'admin' && (
                  <>
                    <DropItem href="/settings" icon={<Settings size={14} />} label="Settings" onClick={() => setOpen(false)} />
                    <div style={{ height: 1, background: 'var(--hair)', margin: '6px 0' }} />
                  </>
                )}
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 transition-colors"
                  style={{
                    padding:    '8px 14px',
                    fontSize:   14,
                    fontWeight: 500,
                    color:      'var(--a-ink)',
                    background: 'transparent',
                    border:     'none',
                    cursor:     'pointer',
                    textAlign:  'left',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--a-soft)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Dropdown menu item ───────────────────────────────────────────────────────

function DropItem({
  href, icon, label, onClick,
}: {
  href: string; icon: React.ReactNode; label: string; onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 transition-colors"
      style={{
        padding:    '8px 14px',
        fontSize:   14,
        fontWeight: 500,
        color:      'var(--ink-2)',
        textDecoration: 'none',
        display:    'flex',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--paper-2)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <span style={{ color: 'var(--ink-3)' }}>{icon}</span>
      {label}
    </Link>
  )
}
