'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/*
  Editorial Duel pipeline stepper.

  Visual spec (wyr.css .pipeline / .pl-*):
  - 30px circles with 1.5px hairline border
  - Done  → solid --ink fill, white checkmark icon
  - Active → white bg, --ink border, 4px ring shadow
  - Future → --card bg, --hair-2 border, --ink-3 numeral
  - Labels: 12px font-semibold; ink-3 (future), ink (done/active)
  - Bars:   46px × 1.5px; --hair-2 (future), --ink (done)
*/

const STEPS = [
  { key: 'theme',   label: 'Theme'   },
  { key: 'ideas',   label: 'Ideas'   },
  { key: 'images',  label: 'Images'  },
  { key: 'stories', label: 'Stories' },
  { key: 'posted',  label: 'Posted'  },
]

const STAGE_TO_STEP: Record<string, number> = {
  ideas_pending:    1,
  ideas_approved:   2,
  images_pending:   2,
  images_approved:  3,
  stories_pending:  3,
  stories_approved: 4,
  design_ready:     4,
  posted:           5,
}

export function CampaignPipeline({
  stage,
  compact = false,
}: {
  stage: string
  compact?: boolean
}) {
  const currentStep = STAGE_TO_STEP[stage] ?? 0

  // Compact: single step label in mono style (used in tight spaces)
  if (compact) {
    const label = STEPS[Math.min(currentStep, STEPS.length - 1)]?.label
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase text-[var(--ink-3)]"
        style={{ fontFamily: 'var(--mono)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--b)]" />
        {label}
      </span>
    )
  }

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done   = i < currentStep
        const active = i === currentStep
        const last   = i === STEPS.length - 1

        return (
          <div key={step.key} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-[7px]">
              {/* Circle mark */}
              <div
                className={cn(
                  'w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                  done
                    ? 'bg-[var(--ink)] border-[1.5px] border-[var(--ink)] text-[var(--paper)]'
                    : active
                      ? 'bg-[var(--card)] border-[1.5px] border-[var(--ink)] text-[var(--ink)]'
                      : 'bg-[var(--card)] border-[1.5px] border-[var(--hair-2)] text-[var(--ink-3)]'
                )}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  // Active ring: 4px ink at 9% opacity
                  boxShadow: active
                    ? '0 0 0 4px color-mix(in oklab, var(--ink) 9%, transparent)'
                    : undefined,
                }}
              >
                {done
                  ? <Check size={13} strokeWidth={2.5} />
                  : String(i + 1).padStart(2, '0')
                }
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[12px] font-semibold whitespace-nowrap leading-none',
                  done || active ? 'text-[var(--ink)]' : 'text-[var(--ink-3)]'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting bar */}
            {!last && (
              <div
                className={cn(
                  'h-[1.5px] w-[46px] mx-2 mb-[24px] rounded-full transition-all',
                  done ? 'bg-[var(--ink)]' : 'bg-[var(--hair-2)]'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
