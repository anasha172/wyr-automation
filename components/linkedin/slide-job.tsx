'use client'

// ─── Screen 2 — Job card slide (one per job) ─────────────────────────────────
// 1080 × 1350 px  (4:5 portrait)
// Design: brand blob top-left, company logo centred, job title, type pill, location.

import type { JobSlide } from '@/lib/linkedin-types'

// Brand blob SVG (yellow + black shapes, top-left corner of each job card)
function BrandBlob() {
  return (
    <svg
      width={148}
      height={148}
      viewBox="0 0 148 148"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {/* Yellow organic shape */}
      <ellipse cx="54" cy="38" rx="48" ry="52" fill="#F5A623" transform="rotate(-18 54 38)" />
      {/* Black dot / counter-shape */}
      <circle cx="30" cy="80" r="20" fill="#111" />
    </svg>
  )
}

interface SlideJobProps {
  job:   JobSlide
  /** Slot number 1-5, shown as small indicator (optional) */
  index?: number
}

export function SlideJob({ job, index }: SlideJobProps) {
  const logoSrc = job.customLogoUrl ?? job.logoUrl

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
      }}
    >
      {/* ── Brand blob (top-left) ─────────────────────────── */}
      <BrandBlob />

      {/* ── Slide index (optional, top-right) ──────────────── */}
      {index !== undefined && (
        <div
          style={{
            position:   'absolute',
            top:        44,
            right:      54,
            fontFamily: '"Space Mono", monospace',
            fontSize:   22,
            color:      '#bbb',
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          {String(index).padStart(2, '0')}/05
        </div>
      )}

      {/* ── Company logo ────────────────────────────────────── */}
      <div
        style={{
          marginBottom:   64,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          320,
          height:         160,
          position:       'relative',
        }}
      >
        {job.logoLoading ? (
          /* Skeleton pulse */
          <div
            style={{
              width:        160,
              height:       80,
              borderRadius: 16,
              background:   'linear-gradient(90deg, #e8e4d8 25%, #d8d4c8 50%, #e8e4d8 75%)',
              backgroundSize: '400% 100%',
              animation:    'shimmer 1.2s ease infinite',
            }}
          />
        ) : logoSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoSrc}
            alt={job.company}
            style={{
              maxWidth:   280,
              maxHeight:  160,
              objectFit:  'contain',
              display:    'block',
            }}
          />
        ) : (
          /* Fallback initial */
          <div
            style={{
              width:          160,
              height:         160,
              borderRadius:   '50%',
              background:     '#111',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       72,
              fontWeight:     800,
              color:          '#fff',
              letterSpacing:  '-0.02em',
            }}
          >
            {job.company.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* ── Job title ───────────────────────────────────────── */}
      <div
        style={{
          fontSize:      96,
          fontWeight:    800,
          color:         '#111',
          textAlign:     'center',
          lineHeight:    1.0,
          letterSpacing: '-0.035em',
          padding:       '0 72px',
          marginBottom:  40,
          maxWidth:      960,
        }}
      >
        {job.title}
      </div>

      {/* ── Job type + location ─────────────────────────────── */}
      <div
        style={{
          fontSize:   44,
          fontWeight: 400,
          color:      '#555',
          marginBottom: 52,
          letterSpacing: '-0.01em',
        }}
      >
        {[job.jobType, job.location].filter(Boolean).join(' · ')}
      </div>

      {/* ── City + country pill ─────────────────────────────── */}
      <div
        style={{
          background:    '#F5A623',
          color:         '#111',
          fontWeight:    800,
          fontSize:      40,
          padding:       '20px 56px',
          borderRadius:  999,
          letterSpacing: '-0.01em',
          marginBottom:  80,
        }}
      >
        {[job.city, job.country].filter(Boolean).join(', ')}
      </div>

      {/* ── Company (bottom) ────────────────────────────────── */}
      <div
        style={{
          position:   'absolute',
          bottom:     80,
          left:       '50%',
          transform:  'translateX(-50%)',
          fontSize:   44,
          fontWeight: 800,
          color:      '#111',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.02em',
        }}
      >
        {job.company}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
