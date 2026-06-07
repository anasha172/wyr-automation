import { cn } from '@/lib/utils'
import { STAGE_LABELS } from '@/lib/utils'

/*
  Maps each pipeline stage to a display kind:
    pending  → mustard dot + flame-tinted pill  (ideas/images/stories awaiting approval)
    progress → cobalt dot + cobalt-tinted pill  (approved, moving forward)
    posted   → green dot + green-tinted pill
*/
const STAGE_KIND: Record<string, 'pending' | 'progress' | 'posted'> = {
  ideas_pending:    'pending',
  ideas_approved:   'progress',
  images_pending:   'pending',
  images_approved:  'progress',
  stories_pending:  'pending',
  stories_approved: 'progress',
  design_ready:     'progress',
  posted:           'posted',
}

const KIND_CLASSES: Record<'pending' | 'progress' | 'posted', { pill: string; dot: string }> = {
  pending: {
    pill: 'border-[var(--a-line)] text-[var(--a-ink)] bg-[var(--pending-soft)]',
    dot:  'bg-[var(--pending)]',
  },
  progress: {
    pill: 'border-[var(--b-line)] text-[var(--b-ink)] bg-[var(--b-soft)]',
    dot:  'bg-[var(--b)]',
  },
  posted: {
    // color-mix not easily expressible as arbitrary value; use a close approximation
    pill: 'border-[color-mix(in_oklab,var(--go)_40%,white)] text-[var(--go-ink)] bg-[var(--go-soft)]',
    dot:  'bg-[var(--go)]',
  },
}

interface StagePillProps {
  stage: string
  className?: string
}

export function StagePill({ stage, className }: StagePillProps) {
  const kind = STAGE_KIND[stage]
  const label = STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage
  const styles = kind ? KIND_CLASSES[kind] : null

  return (
    <span
      className={cn(
        // Base pill — wyr.css .pill
        'inline-flex items-center gap-[7px]',
        'border rounded-[6px] px-[9px] py-1',
        'text-[10.5px] tracking-[0.08em] uppercase font-normal leading-none',
        // font set via inline style to use CSS var reliably
        styles ? styles.pill : 'border-[var(--hair-2)] text-[var(--ink-2)] bg-[var(--card)]',
        className
      )}
      style={{ fontFamily: 'var(--mono)' }}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          styles ? styles.dot : 'bg-[var(--ink-3)]',
          // Pulse the dot for pending stages (awaiting action)
          kind === 'pending' && 'animate-pulse',
        )}
      />
      {label}
    </span>
  )
}
