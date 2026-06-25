'use client'

// ─── Screen 1 — Static intro slide ───────────────────────────────────────────
// 1080 × 1350 px  (4:5 portrait)
// Design: "TOP 5 JOBS / THIS WEEK" with phone mockup placeholder.
// ⚠️  ASSET PLACEHOLDER: replace the <div className="phone-mockup-placeholder">
//     block with <img src="/assets/linkedin/phone-mockup.png" ...> once the
//     asset is available.

export function SlideIntro() {
  return (
    <div
      style={{
        width:          1080,
        height:         1350,
        background:     '#F5F3E8',   // warm cream — matches reference design
        position:       'relative',
        overflow:       'hidden',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        fontFamily:     '"Hanken Grotesk", system-ui, sans-serif',
      }}
    >
      {/* ── Headline ────────────────────────────────────────── */}
      <div style={{ paddingTop: 110, textAlign: 'center', zIndex: 2, position: 'relative' }}>
        <div
          style={{
            fontSize:      168,
            fontWeight:    900,
            lineHeight:    0.9,
            color:         '#111',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
          }}
        >
          TOP 5
        </div>
        <div
          style={{
            fontSize:      168,
            fontWeight:    900,
            lineHeight:    0.9,
            color:         '#111',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
          }}
        >
          JOBS
        </div>
        <div
          style={{
            fontSize:      156,
            fontWeight:    900,
            lineHeight:    0.9,
            color:         '#F5A623',   // gold / amber — from reference
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
          }}
        >
          THIS
        </div>
        <div
          style={{
            fontSize:      156,
            fontWeight:    900,
            lineHeight:    0.9,
            color:         '#F5A623',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
          }}
        >
          WEEK
        </div>
      </div>

      {/* ── Left annotation ─────────────────────────────────── */}
      <div
        style={{
          position:      'absolute',
          left:          54,
          top:           620,
          fontWeight:    800,
          fontSize:      34,
          lineHeight:    1.15,
          textTransform: 'uppercase',
          color:         '#111',
          letterSpacing: '-0.01em',
          zIndex:        3,
        }}
      >
        STUDENTS<br />AND FRESH<br />GRADS
      </div>

      {/* ── Right annotation ────────────────────────────────── */}
      <div
        style={{
          position:      'absolute',
          right:         54,
          top:           620,
          fontWeight:    800,
          fontSize:      34,
          lineHeight:    1.15,
          textTransform: 'uppercase',
          color:         '#111',
          letterSpacing: '-0.01em',
          textAlign:     'right',
          zIndex:        3,
        }}
      >
        TOP UAE<br />COMPANIES<br />ARE HIRING
      </div>

      {/* ── Phone mockup placeholder ─────────────────────────
           Replace this entire block with:
           <img src="/assets/linkedin/phone-mockup.png"
                alt="" width={520} style={{ position:'absolute', bottom: 80, left: '50%', transform:'translateX(-50%)' }} />
           once the asset is available.
      ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position:      'absolute',
          bottom:        100,
          left:          '50%',
          transform:     'translateX(-50%)',
          width:         400,
          height:        640,
          borderRadius:  48,
          border:        '3px dashed #ccc',
          background:    'rgba(245,166,35,0.08)',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          justifyContent:'center',
          gap:           12,
          zIndex:        2,
        }}
      >
        <div style={{ fontSize: 48 }}>📱</div>
        <div
          style={{
            fontFamily:    '"Space Mono", monospace',
            fontSize:      13,
            color:         '#999',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            textAlign:     'center',
            padding:       '0 24px',
          }}
        >
          Phone mockup asset<br />goes here
        </div>
      </div>

      {/* ── Brand watermark ─────────────────────────────────── */}
      <div
        style={{
          position:  'absolute',
          bottom:    40,
          left:      54,
          fontWeight: 700,
          fontSize:  28,
          color:     '#111',
          zIndex:    4,
          letterSpacing: '-0.01em',
        }}
      >
        twe.co
      </div>
    </div>
  )
}
