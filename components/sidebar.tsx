'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, List, BarChart3,
  Users, ShieldCheck,
  Lightbulb, Image, Clapperboard, Send,
} from 'lucide-react'
import { InstagramIcon, LinkedInIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Extract campaign id from /campaigns/[id]/... */
function parseCampaignId(pathname: string): string | null {
  const m = pathname.match(/^\/campaigns\/([^/]+)\//)
  return m?.[1] ?? null
}

/** True when we're on one of the 4 campaign flow pages */
function isFlowPath(pathname: string) {
  return /^\/campaigns\/[^/]+\/(ideas|images|design|publish)/.test(pathname)
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SbSection({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 px-[10px] pt-[18px] pb-[7px]"
      style={{
        fontFamily:    'var(--mono)',
        fontSize:      10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color:         'var(--ink-3)',
      }}
    >
      <span className="shrink-0">{children}</span>
      <span className="flex-1 h-px bg-[var(--hair)]" />
    </div>
  )
}

// ─── Nav item ────────────────────────────────────────────────────────────────

interface NavItemProps {
  href?:     string
  icon?:     React.ReactNode
  label:     string
  num?:      string            // mono numeral prefix (flow steps)
  tag?:      string            // right-side mono tag e.g. "Story" / "Soon"
  active?:   boolean
  disabled?: boolean
  onClick?:  () => void
}

function NavItem({ href, icon, label, num, tag, active, disabled, onClick }: NavItemProps) {
  const base = cn(
    'flex items-center gap-[11px] px-[11px] py-[9px] rounded-[8px]',
    'text-[14px] font-medium transition-all select-none whitespace-nowrap',
    active   && 'bg-[var(--ink)] text-[var(--paper)]',
    !active  && !disabled && 'text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] cursor-pointer',
    disabled && 'text-[var(--ink-3)] opacity-60 cursor-not-allowed',
  )

  const inner = (
    <>
      {/* Mono step numeral */}
      {num != null && (
        <span
          className="shrink-0 tabular-nums"
          style={{
            fontFamily: 'var(--mono)',
            fontSize:   11,
            width:      16,
            color:      active ? 'rgba(251,250,247,0.55)' : 'var(--ink-3)',
          }}
        >
          {num}
        </span>
      )}

      {/* Icon — inherits text colour; icon span locks colour independently when inactive */}
      {icon && (
        <span
          className="flex shrink-0"
          style={{ color: active ? 'var(--paper)' : disabled ? 'var(--ink-3)' : 'var(--ink-3)' }}
        >
          {icon}
        </span>
      )}

      <span className="flex-1 min-w-0 truncate">{label}</span>

      {/* Right-side mono tag ("Story", "Soon", …) */}
      {tag && (
        <span
          className="shrink-0"
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         active ? 'rgba(251,250,247,0.55)' : 'var(--ink-3)',
            border:        `1px solid ${active ? 'rgba(251,250,247,0.2)' : 'var(--hair-2)'}`,
            borderRadius:  5,
            padding:       '1px 5px',
          }}
        >
          {tag}
        </span>
      )}
    </>
  )

  // Render as Link when there's an href and no custom click override
  if (href && !disabled && !onClick) {
    return <Link href={href} className={base}>{inner}</Link>
  }

  return (
    <div
      className={base}
      onClick={disabled ? undefined : onClick}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={disabled || !onClick ? undefined : (e) => e.key === 'Enter' && onClick()}
    >
      {inner}
    </div>
  )
}

// ─── Channel group (parent label + indented sub-items) ───────────────────────

function ChannelGroup({
  icon,
  label,
  children,
}: {
  icon:     React.ReactNode
  label:    string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 2 }}>
      {/* Non-clickable channel label */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          padding:    '8px 11px 3px',
        }}
      >
        <span style={{ display: 'flex', color: 'var(--ink-3)', flexShrink: 0 }}>
          {icon}
        </span>
        <span
          style={{
            fontFamily: 'var(--sans)',
            fontSize:   13.5,
            fontWeight: 600,
            color:      'var(--ink-2)',
          }}
        >
          {label}
        </span>
      </div>
      {/* Indented sub-items */}
      <div style={{ paddingLeft: 22 }}>
        {children}
      </div>
    </div>
  )
}

// ─── Flow steps shown under open campaign ────────────────────────────────────

const FLOW_STEPS = [
  { id: 'ideas',   label: 'Ideas',   icon: <Lightbulb size={16} />,    href: (id: string) => `/campaigns/${id}/ideas`   },
  { id: 'images',  label: 'Images',  icon: <Image size={16} />,        href: (id: string) => `/campaigns/${id}/images`  },
  { id: 'stories', label: 'Stories', icon: <Clapperboard size={16} />, href: (id: string) => `/campaigns/${id}/design`  },
  { id: 'publish', label: 'Publish', icon: <Send size={16} />,         href: (id: string) => `/campaigns/${id}/publish` },
]

function flowStepId(pathname: string): string | null {
  if (pathname.includes('/ideas'))   return 'ideas'
  if (pathname.includes('/images'))  return 'images'
  if (pathname.includes('/design'))  return 'stories'
  if (pathname.includes('/publish')) return 'publish'
  return null
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const user      = useUser()
  const role      = user?.role ?? 'publisher'

  // Campaign context (flow pages)
  const campaignId    = parseCampaignId(pathname)
  const inFlow        = isFlowPath(pathname)
  const activeStep    = flowStepId(pathname)
  const [campaignTheme, setCampaignTheme] = useState<string | null>(null)

  // Fetch the campaign theme for the sub-nav section header
  useEffect(() => {
    if (!campaignId || !inFlow) { setCampaignTheme(null); return }

    if (isDemoMode) {
      setCampaignTheme(demoStore.campaigns.get(campaignId)?.theme ?? null)
      return
    }

    createClient()
      .from('campaigns')
      .select('theme')
      .eq('id', campaignId)
      .single()
      .then(({ data }) => setCampaignTheme(data?.theme ?? null))
  }, [campaignId, inFlow])

  const isPub = role === 'publisher'
  const isMgr = role === 'manager'

  // Shorten the campaign theme for the section label
  const sectionTheme = campaignTheme
    ? campaignTheme.length > 20 ? campaignTheme.slice(0, 20) + '…' : campaignTheme
    : 'Campaign'

  return (
    <aside
      className="flex flex-col h-screen flex-shrink-0"
      style={{
        width:       256,
        background:  'var(--paper)',
        borderRight: '1px solid var(--hair)',
        position:    'relative',
        zIndex:      20,
      }}
    >
      {/* ── Brand ──────────────────────────────────────────────── */}
      <Link
        href="/"
        className="flex items-end gap-[10px] no-underline"
        style={{
          padding:      '22px 22px 18px',
          borderBottom: '1px solid var(--hair)',
          flexShrink:   0,
        }}
      >
        {/* Serif PostDeck wordmark — Post=ink, Deck=cobalt */}
        <div
          style={{
            fontFamily:    'var(--serif)',
            fontWeight:    700,
            fontSize:      24,
            letterSpacing: '-0.03em',
            lineHeight:    1,
            color:         'var(--ink)',
          }}
        >
          <span>Post</span><span style={{ color: 'var(--b)' }}>Deck</span>
        </div>

        {/* Stacked mono "SOCIAL / MEDIA / STUDIO" tag */}
        <div
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      9.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
            lineHeight:    1.55,
            marginBottom:  2,
          }}
        >
          Social<br />Media<br />Studio
        </div>
      </Link>

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{ padding: '8px 12px 18px' }}
      >
        {/* WORKSPACE */}
        <SbSection>Workspace</SbSection>

        <NavItem
          href="/"
          icon={<LayoutDashboard size={16} />}
          label="Dashboard"
          active={pathname === '/'}
        />


        {isMgr && (
          <NavItem
            href="/manager"
            icon={<BarChart3 size={16} />}
            label="Manager Overview"
            active={pathname === '/manager'}
          />
        )}

        {/* CHANNELS — publisher + admin */}
        {isPub && (
          <>
            <SbSection>Channels</SbSection>

            <ChannelGroup icon={<InstagramIcon size={16} />} label="Instagram">
              <NavItem
                href="/campaigns/new"
                label="New Campaign"
                active={
                  pathname === '/campaigns/new' ||
                  (inFlow && !!campaignId)
                }
              />
            </ChannelGroup>

            <ChannelGroup icon={<LinkedInIcon size={16} />} label="LinkedIn">
              <NavItem
                href="/linkedin/new"
                label="New Post"
                active={pathname.startsWith('/linkedin')}
              />
            </ChannelGroup>
          </>
        )}

        {/* CAMPAIGN FLOW — numbered sub-list under open campaign (publisher + manager) */}
        {(isPub || isMgr) && inFlow && campaignId && (
          <>
            <SbSection>{sectionTheme}</SbSection>

            {FLOW_STEPS.map((step, i) => (
              <NavItem
                key={step.id}
                href={step.href(campaignId)}
                icon={step.icon}
                label={step.label}
                num={String(i + 1).padStart(2, '0')}
                active={activeStep === step.id}
              />
            ))}
          </>
        )}

        {/* ADMIN — admin only */}
        {role === 'admin' && (
          <>
            <SbSection>Admin</SbSection>
            <NavItem
              href="/admin/users"
              icon={<Users size={16} />}
              label="User Management"
              active={pathname.startsWith('/admin')}
            />
            <NavItem
              href="/settings"
              icon={<ShieldCheck size={16} />}
              label="Global Settings"
              active={pathname === '/settings'}
            />
          </>
        )}

      </nav>

    </aside>
  )
}
