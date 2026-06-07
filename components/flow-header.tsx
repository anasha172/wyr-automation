'use client'

import { InstagramIcon } from '@/components/icons'
import { StagePill } from '@/components/stage-pill'
import { CampaignPipeline } from '@/components/campaign-pipeline'

/*
  FlowHeader — campaign-context banner for all flow pages (Ideas, Images, Stories, Publish).
  Sits between the global topbar and the page content.

  Layout (stacked, matches reference/wyr-flowhead.jsx):
    ┌─────────────────────────────────────────────────────┐
    │ 03  IDEAS · CONTROVERSIAL · GENERAL   [StagePill]   │
    │ Campaign Theme (serif 38px)  [Instagram Story pill] │
    │ ──●──○──○──○──○  (Pipeline stepper, full-width)     │
    └─────────────────────────────────────────────────────┘
*/

const STEP_META: Record<string, { num: string; label: string }> = {
  ideas:   { num: '03', label: 'Ideas'   },
  images:  { num: '04', label: 'Images'  },
  design:  { num: '05', label: 'Stories' },
  publish: { num: '06', label: 'Publish' },
}

interface FlowHeaderProps {
  theme:       string
  stage:       string
  currentStep: 'ideas' | 'images' | 'design' | 'publish'
  tone?:       string
  audience?:   string
}

export function FlowHeader({ theme, stage, currentStep, tone, audience }: FlowHeaderProps) {
  const { num, label } = STEP_META[currentStep] ?? { num: '03', label: 'Ideas' }

  // Build eyebrow suffix: "IDEAS · CONTROVERSIAL · GENERAL" when tone/audience present
  const suffix = [label, tone, audience?.replace(/-/g, ' ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      style={{
        background:   'color-mix(in oklab, var(--paper) 70%, white)',
        borderBottom: '1px solid var(--hair)',
        padding:      '22px 40px',
      }}
    >
      {/* ── Row 1: eyebrow left, StagePill right ──────────── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginBottom:   10,
        }}
      >
        <span
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
          }}
        >
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{num}</span>
          {'  '}
          {suffix}
        </span>

        <StagePill stage={stage} />
      </div>

      {/* ── Row 2: serif theme title + Instagram Story pill ── */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily:    'var(--serif)',
            fontSize:      38,
            fontWeight:    500,
            letterSpacing: '-0.025em',
            lineHeight:    1.05,
            color:         'var(--ink)',
            margin:        0,
            display:       'inline-block',
            marginRight:   14,
            verticalAlign: 'middle',
            whiteSpace:    'nowrap',
          }}
        >
          {theme}
        </h1>

        {/* Instagram Story pill */}
        <span
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           6,
            fontFamily:    'var(--mono)',
            fontSize:      10.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding:       '3px 8px',
            borderRadius:  6,
            border:        '1px solid var(--hair-2)',
            color:         'var(--ink-2)',
            background:    'var(--paper-2)',
            lineHeight:    1,
            verticalAlign: 'middle',
          }}
        >
          <span style={{ display: 'flex', color: 'var(--a)' }}>
            <InstagramIcon size={11} />
          </span>
          Instagram Story
        </span>
      </div>

      {/* ── Row 3: full-width pipeline stepper ────────────── */}
      <CampaignPipeline stage={stage} />
    </div>
  )
}
