/*
  StoryFrame — wyr.css .story / .story-half / .story-vs / .story-hdr
  9:16 Instagram Story mock-up.

  Layout (top → bottom):
    ┌─────────────────────────────┐
    │  "WOULD YOU RATHER"  mono   │  absolute, top 7%
    │                             │
    │   ── A half (flame) ──      │  flex-1
    │   [image] + multiply tint   │
    │   + gradient veil           │
    │   + option text (bottom)    │
    │                             │
    │      [ vs  disc ]           │  absolute, 50% centre
    │                             │
    │   ── B half (cobalt) ──     │  flex-1
    │   [image] + multiply tint   │
    │   + gradient veil           │
    │   + option text (top)       │
    └─────────────────────────────┘

  Props
    imageA / imageB    — src URL (or null for striped placeholder)
    optionA / optionB  — WYR question text
    width              — rendered pixel width (height = width × 16/9)
*/

interface StoryFrameProps {
  imageA?:  string | null
  imageB?:  string | null
  optionA?: string
  optionB?: string
  width?:   number
}

const STRIPE_BG =
  'var(--paper-2) repeating-linear-gradient(45deg,transparent,transparent 9px,rgba(26,24,21,.05) 9px,rgba(26,24,21,.05) 10px)'

function Placeholder({ label }: { label: string }) {
  return (
    <div
      style={{
        position:       'absolute',
        inset:          0,
        background:     STRIPE_BG,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     'var(--mono)',
        fontSize:       10,
        letterSpacing:  '0.1em',
        textTransform:  'uppercase',
        color:          'var(--ink-3)',
      }}
    >
      {label}
    </div>
  )
}

export function StoryFrame({
  imageA,
  imageB,
  optionA,
  optionB,
  width = 150,
}: StoryFrameProps) {
  const optFontSize = Math.round(width * 0.072)   // ~10.8px at 150px wide
  const vsSize      = Math.round(width * 0.17)    // ~25.5px at 150px wide
  const vsFontSize  = Math.round(width * 0.075)   // ~11px at 150px wide

  return (
    <div
      style={{
        width,
        aspectRatio:   '9 / 16',
        borderRadius:  14,
        overflow:      'hidden',
        background:    'var(--ink)',
        position:      'relative',
        display:       'flex',
        flexDirection: 'column',
        boxShadow:     'var(--shadow)',
        flexShrink:    0,
      }}
    >
      {/* "WOULD YOU RATHER" header — sits above everything */}
      <div
        style={{
          position:      'absolute',
          top:           '7%',
          left:          0,
          right:         0,
          textAlign:     'center',
          zIndex:        3,
          fontFamily:    'var(--mono)',
          fontSize:      Math.round(width * 0.06),
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color:         'rgba(255,255,255,0.92)',
          pointerEvents: 'none',
        }}
      >
        Would You Rather
      </div>

      {/* ── A half (flame) ─────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {imageA
          ? (
            <img
              src={imageA}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )
          : <Placeholder label="A" />
        }
        {/* Flame multiply tint */}
        <div
          style={{
            position:      'absolute',
            inset:         0,
            background:    'var(--a)',
            mixBlendMode:  'multiply',
            opacity:       0.55,
          }}
        />
        {/* Veil gradient */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.35))',
          }}
        />
        {/* Option A text — anchored to bottom of half */}
        {optionA && (
          <div
            style={{
              position:    'absolute',
              bottom:      '12%',
              left:        0,
              right:       0,
              padding:     '0 8%',
              color:       '#fff',
              fontFamily:  'var(--serif)',
              fontWeight:  600,
              textAlign:   'center',
              letterSpacing: '-0.01em',
              textShadow:  '0 2px 14px rgba(0,0,0,0.4)',
              fontSize:    optFontSize,
              lineHeight:  1.2,
              zIndex:      1,
            }}
          >
            {optionA}
          </div>
        )}
      </div>

      {/* ── B half (cobalt) ────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {imageB
          ? (
            <img
              src={imageB}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )
          : <Placeholder label="B" />
        }
        {/* Cobalt multiply tint */}
        <div
          style={{
            position:     'absolute',
            inset:        0,
            background:   'var(--b)',
            mixBlendMode: 'multiply',
            opacity:      0.55,
          }}
        />
        {/* Veil gradient */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.35))',
          }}
        />
        {/* Option B text — anchored to top of half */}
        {optionB && (
          <div
            style={{
              position:      'absolute',
              top:           '12%',
              left:          0,
              right:         0,
              padding:       '0 8%',
              color:         '#fff',
              fontFamily:    'var(--serif)',
              fontWeight:    600,
              textAlign:     'center',
              letterSpacing: '-0.01em',
              textShadow:    '0 2px 14px rgba(0,0,0,0.4)',
              fontSize:      optFontSize,
              lineHeight:    1.2,
              zIndex:        1,
            }}
          >
            {optionB}
          </div>
        )}
      </div>

      {/* ── VS disc — centred on the seam ─────────────────── */}
      <div
        style={{
          position:       'absolute',
          top:            '50%',
          left:           '50%',
          transform:      'translate(-50%, -50%)',
          zIndex:         4,
          width:          vsSize,
          height:         vsSize,
          borderRadius:   '50%',
          background:     'var(--paper)',
          color:          'var(--ink)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'var(--serif)',
          fontStyle:      'italic',
          fontWeight:     600,
          fontSize:       vsFontSize,
          boxShadow:      '0 4px 16px rgba(0,0,0,0.35)',
          border:         '2px solid #fff',
          lineHeight:     1,
        }}
      >
        vs
      </div>
    </div>
  )
}
