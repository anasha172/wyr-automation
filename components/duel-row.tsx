import { VS } from './vs'

/*
  DuelRow — wyr.css .duel
  3-column grid: [flame A side] [1px seam + VS disc] [cobalt B side].

  Props
    optionA / optionB  — the WYR question text (string or ReactNode)
    labelA / labelB    — override the tag label (default "Option A" / "Option B")
    className          — extra classes on the outer wrapper
*/

interface DuelRowProps {
  optionA: React.ReactNode
  optionB: React.ReactNode
  labelA?: string
  labelB?: string
  className?: string
}

export function DuelRow({
  optionA,
  optionB,
  labelA = 'Option A',
  labelB = 'Option B',
  className,
}: DuelRowProps) {
  return (
    <div
      className={`rounded-[14px] border border-[var(--hair)] overflow-hidden bg-[var(--card)] ${className ?? ''}`}
      style={{
        display:             'grid',
        gridTemplateColumns: '1fr auto 1fr',
        boxShadow:           'var(--shadow-sm)',
      }}
    >
      {/* ── A side (flame) ─────────────────────────────────── */}
      <div
        className="bg-[var(--a-soft)] p-[18px_20px]"
        style={{ minWidth: 0 }}
      >
        {/* opt-tag */}
        <span
          className="flex items-center gap-1.5 text-[var(--a-ink)]"
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight:    700,
            marginBottom:  8,
          }}
        >
          <span>A</span>
          <span style={{ opacity: 0.5 }}>—</span>
          <span>{labelA}</span>
        </span>

        {/* opt-text */}
        <p
          className="text-[var(--ink)]"
          style={{
            fontFamily:    'var(--serif)',
            fontSize:      19,
            lineHeight:    1.18,
            letterSpacing: '-0.01em',
            margin:        0,
          }}
        >
          {optionA}
        </p>
      </div>

      {/* ── Seam + VS ──────────────────────────────────────── */}
      <div
        className="bg-[var(--hair-2)] relative flex items-center justify-center overflow-visible"
        style={{ width: 1 }}
      >
        <div style={{ position: 'absolute', zIndex: 2 }}>
          <VS size={42} />
        </div>
      </div>

      {/* ── B side (cobalt) ────────────────────────────────── */}
      <div
        className="bg-[var(--b-soft)] p-[18px_20px] text-right"
        style={{ minWidth: 0 }}
      >
        {/* opt-tag */}
        <span
          className="flex items-center gap-1.5 justify-end text-[var(--b-ink)]"
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight:    700,
            marginBottom:  8,
          }}
        >
          <span>{labelB}</span>
          <span style={{ opacity: 0.5 }}>—</span>
          <span>B</span>
        </span>

        {/* opt-text */}
        <p
          className="text-[var(--ink)]"
          style={{
            fontFamily:    'var(--serif)',
            fontSize:      19,
            lineHeight:    1.18,
            letterSpacing: '-0.01em',
            margin:        0,
          }}
        >
          {optionB}
        </p>
      </div>
    </div>
  )
}
