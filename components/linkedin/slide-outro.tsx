'use client'

// ─── Screen 3 — Static outro / CTA slide ─────────────────────────────────────
// 1080 × 1350 px  (4:5 portrait)
// Design: "WANT TO GET HIRED?" headline, body copy, app-store badges, social handles.
//
// ⚠️  ASSET PLACEHOLDERS:
//   - App Store badge  → replace placeholder div with <img src="/assets/linkedin/appstore.png" />
//   - Google Play badge → replace placeholder div with <img src="/assets/linkedin/googleplay.png" />
//   - Instagram icon   → replace placeholder with <img src="/assets/linkedin/ig-icon.png" />
//   - TikTok icon      → replace placeholder with <img src="/assets/linkedin/tiktok-icon.png" />
//   - Brand blobs (bottom-left) → replace with <img src="/assets/linkedin/blobs-outro.png" />

function BlobsOutro() {
  // Simplified CSS version of the bottom-left brand blobs from Screen 3 reference
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 320, height: 320, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: 20, left: -30, width: 200, height: 220, background: '#F5A623', borderRadius: '50% 50% 50% 30% / 60% 60% 40% 40%' }} />
      <div style={{ position: 'absolute', bottom: -10, left: 60, width: 140, height: 160, background: '#111', borderRadius: '40% 60% 60% 40% / 50% 50% 50% 50%' }} />
      <div style={{ position: 'absolute', bottom: 80, left: 130, width: 80, height: 80, background: '#F5A623', borderRadius: '50%' }} />
    </div>
  )
}

// Badge placeholder component — swap for <img> when assets arrive
function BadgePlaceholder({ label, width = 240 }: { label: string; width?: number }) {
  return (
    <div
      style={{
        width,
        height:         76,
        background:     '#111',
        borderRadius:   16,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            12,
        padding:        '0 24px',
      }}
    >
      <div style={{ fontSize: 36, color: '#fff' }}>{label === 'App Store' ? '🍎' : '▶'}</div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 14, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label === 'App Store' ? 'Download on the' : 'Get it on'}
        </div>
        <div style={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 700, fontSize: 28, color: '#fff', letterSpacing: '-0.01em' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

export function SlideOutro() {
  return (
    <div
      style={{
        width:          1080,
        height:         1350,
        background:     '#F5F3E8',
        position:       'relative',
        overflow:       'hidden',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     '"Hanken Grotesk", system-ui, sans-serif',
        paddingBottom:  120,
      }}
    >
      {/* ── Headline ────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div
          style={{
            fontSize:      144,
            fontWeight:    900,
            color:         '#111',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            lineHeight:    0.88,
          }}
        >
          WANT TO<br />GET{' '}
          <span style={{ color: '#F5A623' }}>HIRED</span>
          <span style={{ color: '#111' }}>?</span>
        </div>
      </div>

      {/* ── Body copy ───────────────────────────────────────── */}
      <div
        style={{
          fontSize:     46,
          fontWeight:   600,
          color:        '#111',
          textAlign:    'center',
          maxWidth:     860,
          lineHeight:   1.35,
          marginBottom: 72,
          letterSpacing: '-0.015em',
          padding:      '0 40px',
        }}
      >
        Find <strong>200+</strong> open positions for students and
        fresh graduates on the{' '}
        <span style={{ color: '#F5A623', fontWeight: 800 }}>+twe</span>
        {' '}app and sign up for our career fair!
      </div>

      {/* ── App store badges ────────────────────────────────── */}
      {/* ⚠️ Replace the BadgePlaceholder components below with <img> tags once assets are available */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 72 }}>
        <BadgePlaceholder label="App Store" />
        <BadgePlaceholder label="Google Play" />
      </div>

      {/* ── Social handles ──────────────────────────────────── */}
      {/* ⚠️ Replace the emoji icons with actual brand SVG assets once available */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        28,
          fontSize:   40,
          fontWeight: 600,
          color:      '#111',
        }}
      >
        {/* Instagram icon placeholder */}
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28 }}>Ig</div>
        {/* TikTok icon placeholder */}
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 800 }}>Tt</div>
        <span style={{ letterSpacing: '-0.01em' }}>@twe.social</span>
        {/* Globe icon */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🌐</div>
        <span style={{ letterSpacing: '-0.01em' }}>twe.co</span>
      </div>

      {/* ── Bottom-left brand blobs ──────────────────────────── */}
      <BlobsOutro />
    </div>
  )
}
