'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Building2,
  User, Clock, Loader2, CheckCircle2, ExternalLink,
  ImageIcon,
} from 'lucide-react'
import { LinkedInIcon } from '@/components/linkedin/linkedin-icon'
import { Button } from '@/components/ui/button'
import { SlideIntro }  from '@/components/linkedin/slide-intro'
import { SlideJob }    from '@/components/linkedin/slide-job'
import { SlideOutro }  from '@/components/linkedin/slide-outro'
import type { JobSlide, LinkedInPostMode, LinkedInPostTarget } from '@/lib/linkedin-types'

const PREVIEW_W = 160
const SCALE     = PREVIEW_W / 1080
const SLIDE_H   = Math.round(1350 * SCALE)

// ─── Caption generator ────────────────────────────────────────────────────────

function buildCaption(jobs: JobSlide[]): string {
  const lines = jobs.map(j => `⭐ ${j.company} - ${j.title}  ${j.jobUrl || ''}`.trim())
  return [
    '🚨 Top companies are on a hiring spree. Are you keeping up?\n',
    `Here are this week's top ${jobs.length} roles for students & fresh graduates in the UAE:\n`,
    ...lines,
    '\n📌 Why stop here? Find 200+ open positions for students and fresh grads on the +twe app!\n',
    '🤍',
  ].join('\n')
}

// ─── Mini slide thumbnail ─────────────────────────────────────────────────────

function MiniThumb({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width:        PREVIEW_W,
        height:       SLIDE_H,
        borderRadius: 8,
        overflow:     'hidden',
        border:       '1px solid var(--hair)',
        background:   'var(--paper-2)',
        flexShrink:   0,
      }}
    >
      <div
        style={{
          width:           1080,
          height:          1350,
          transform:       `scale(${SCALE})`,
          transformOrigin: 'top left',
          pointerEvents:   'none',
          userSelect:      'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Hidden render stage for html2canvas ─────────────────────────────────────

function HiddenStage({
  jobs,
  stageRef,
}: {
  jobs:     JobSlide[]
  stageRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        top:           0,
        left:          '-9999px',
        width:         1080,
        zIndex:        -1,
        pointerEvents: 'none',
        userSelect:    'none',
      }}
    >
      <div data-slide="intro" style={{ width: 1080, height: 1350, overflow: 'hidden' }}>
        <SlideIntro />
      </div>
      {jobs.map((job, i) => (
        <div key={job.rowIndex} data-slide={`job-${i}`} style={{ width: 1080, height: 1350, overflow: 'hidden' }}>
          <SlideJob job={job} index={i + 1} />
        </div>
      ))}
      <div data-slide="outro" style={{ width: 1080, height: 1350, overflow: 'hidden' }}>
        <SlideOutro />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LinkedInPublishPage() {
  const router     = useRouter()
  const stageRef   = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLTextAreaElement>(null)

  const [jobs,       setJobs]       = useState<JobSlide[]>([])
  const [caption,    setCaption]    = useState('')
  const [postMode,   setPostMode]   = useState<LinkedInPostMode>('now')
  const [postTarget, setTarget]     = useState<LinkedInPostTarget>('personal')
  const [scheduleAt, setScheduleAt] = useState('')
  const [exporting,  setExporting]  = useState(false)
  const [exportStep, setExportStep] = useState('')
  const [posting,    setPosting]    = useState(false)
  const [posted,     setPosted]     = useState(false)
  const [postUrl,    setPostUrl]    = useState('')
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('linkedin_jobs')
    if (!raw) { router.push('/linkedin/new'); return }
    const rows: JobSlide[] = JSON.parse(raw)
    setJobs(rows)
    setCaption(buildCaption(rows))
  }, [router])

  // Auto-resize caption textarea
  useEffect(() => {
    if (captionRef.current) {
      captionRef.current.style.height = 'auto'
      captionRef.current.style.height = captionRef.current.scrollHeight + 'px'
    }
  }, [caption])

  // ── Capture all slides via html2canvas ───────────────────────────────────

  const captureSlides = useCallback(async (): Promise<string[]> => {
    setExporting(true)
    setExportStep('Loading renderer…')
    const html2canvas = (await import('html2canvas')).default
    const stage = stageRef.current
    if (!stage) throw new Error('Render stage not found')

    const slides = Array.from(stage.querySelectorAll<HTMLElement>('[data-slide]'))
    const dataUrls: string[] = []

    for (let i = 0; i < slides.length; i++) {
      setExportStep(`Rendering slide ${i + 1} of ${slides.length}…`)
      const canvas = await html2canvas(slides[i], {
        width:           1080,
        height:          1350,
        scale:           1,
        useCORS:         true,
        allowTaint:      false,
        backgroundColor: '#F5F3E8',
        logging:         false,
      })
      dataUrls.push(canvas.toDataURL('image/jpeg', 0.92))
    }

    setExporting(false)
    setExportStep('')
    return dataUrls
  }, [])

  // ── Publish ──────────────────────────────────────────────────────────────

  async function publish() {
    setPosting(true)
    setError(null)
    try {
      const imageDataUrls = await captureSlides()

      setExportStep('Posting to LinkedIn…')
      const res  = await fetch('/api/linkedin/post', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrls,
          caption,
          target:      postTarget,
          scheduledAt: postMode === 'schedule' ? scheduleAt : null,
          jobs,        // snapshot saved to DB for dashboard history
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Post failed')

      setExportStep('Updating Google Sheet…')
      await fetch('/api/linkedin/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndexes: jobs.map(j => j.rowIndex) }),
      })

      setPostUrl(data.postUrl ?? '')
      sessionStorage.removeItem('linkedin_jobs')
      setPosted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPosting(false)
      setExporting(false)
      setExportStep('')
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (posted) {
    return (
      <div style={{ padding: '28px 40px 80px', maxWidth: 560 }}>
        <div
          style={{
            width:          72,
            height:         72,
            borderRadius:   20,
            background:     'var(--go-soft)',
            border:         '1px solid color-mix(in oklab, var(--go) 30%, white)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '24px auto 22px',
            color:          'var(--go-ink)',
          }}
        >
          <CheckCircle2 size={34} />
        </div>

        <span
          style={{
            display:       'block',
            fontFamily:    'var(--mono)',
            fontSize:      11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
            marginBottom:  12,
          }}
        >
          Live
        </span>

        <h1
          style={{
            fontFamily:    'var(--serif)',
            fontWeight:    500,
            fontSize:      44,
            letterSpacing: '-0.025em',
            color:         'var(--ink)',
            margin:        '0 0 12px',
          }}
        >
          It&apos;s posted.
        </h1>

        <p style={{ color: 'var(--ink-2)', fontSize: 15.5, marginBottom: 6 }}>
          {jobs.length + 2} slides posted to LinkedIn.
        </p>
        <p style={{ color: 'var(--ink-2)', fontSize: 15.5, marginBottom: 28 }}>
          {jobs.length} job{jobs.length !== 1 ? 's' : ''} marked as{' '}
          <strong style={{ color: 'var(--go-ink)' }}>Posted</strong> in Google Sheets.
        </p>

        {postUrl && (
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            6,
              color:          'var(--b-ink)',
              fontWeight:     600,
              fontSize:       14,
              marginBottom:   32,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} />
            View on LinkedIn
          </a>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button variant="ink" onClick={() => router.push('/linkedin/new')}>
            <LinkedInIcon size={15} />
            New Post
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const busy = posting || exporting

  // ── Main publish screen ───────────────────────────────────────────────────
  return (
    <>
      <HiddenStage jobs={jobs} stageRef={stageRef} />

      <div style={{ padding: '28px 40px 80px' }}>

        {/* ── Masthead ─────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <span
            style={{
              display:       'block',
              fontFamily:    'var(--mono)',
              fontSize:      11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'var(--ink-3)',
              marginBottom:  12,
            }}
          >
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>03</span>
            {'  '}LinkedIn · Publish
          </span>

          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontWeight:    500,
              fontSize:      46,
              letterSpacing: '-0.025em',
              lineHeight:    1.0,
              color:         'var(--ink)',
              margin:        0,
            }}
          >
            Review &amp; publish
          </h1>

          <p style={{ color: 'var(--ink-2)', fontSize: 15.5, marginTop: 12 }}>
            {jobs.length + 2} slides · review caption then post to LinkedIn.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>

          {/* ── Left: slides + caption ──────────────────────── */}
          <div>
            {/* Slide strip */}
            <div
              style={{
                background:   'var(--card)',
                border:       '1px solid var(--hair)',
                borderRadius: 14,
                padding:      '16px 20px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-2)' }}>
                  Carousel preview
                </span>
                <span
                  style={{
                    display:       'inline-flex',
                    alignItems:    'center',
                    gap:           6,
                    fontFamily:    'var(--mono)',
                    fontSize:      10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding:       '4px 9px',
                    borderRadius:  6,
                    border:        '1px solid var(--hair-2)',
                    color:         'var(--ink-2)',
                  }}
                >
                  <LinkedInIcon size={11} />
                  {jobs.length + 2} slides
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                <MiniThumb><SlideIntro /></MiniThumb>
                {jobs.map((job, i) => (
                  <MiniThumb key={job.rowIndex}><SlideJob job={job} index={i + 1} /></MiniThumb>
                ))}
                <MiniThumb><SlideOutro /></MiniThumb>
              </div>
            </div>

            {/* Caption editor */}
            <div
              style={{
                background:   'var(--card)',
                border:       '1px solid var(--hair)',
                borderRadius: 14,
                overflow:     'hidden',
              }}
            >
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--hair)', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>Post caption</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 'auto' }}>
                  {caption.length} chars
                </span>
              </div>
              <textarea
                ref={captionRef}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                style={{
                  width:      '100%',
                  fontFamily: 'var(--sans)',
                  fontSize:   14,
                  color:      'var(--ink)',
                  background: 'var(--card)',
                  border:     'none',
                  outline:    'none',
                  padding:    '16px 18px',
                  resize:     'none',
                  lineHeight: 1.6,
                  minHeight:  200,
                  boxSizing:  'border-box',
                }}
              />
            </div>
          </div>

          {/* ── Right: posting options ───────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Post as */}
            <div
              style={{
                background:   'var(--card)',
                border:       '1px solid var(--hair)',
                borderRadius: 14,
                overflow:     'hidden',
              }}
            >
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--hair)' }}>
                <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>Post as</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {([
                  { value: 'personal', label: 'Personal profile', icon: <User size={15} />,      sub: 'Your LinkedIn account' },
                  { value: 'company',  label: 'Company page',     icon: <Building2 size={15} />, sub: '+twe · company page' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTarget(opt.value)}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          12,
                      padding:      '12px 14px',
                      borderRadius: 10,
                      border:       `1px solid ${postTarget === opt.value ? 'var(--ink)' : 'var(--hair-2)'}`,
                      background:   postTarget === opt.value ? 'var(--ink)' : 'var(--card)',
                      cursor:       'pointer',
                      color:        postTarget === opt.value ? 'var(--paper)' : 'var(--ink)',
                      textAlign:    'left',
                      transition:   'all .14s',
                    }}
                  >
                    <span style={{ display: 'flex', opacity: postTarget === opt.value ? 1 : 0.6 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{opt.sub}</div>
                    </div>
                    {postTarget === opt.value && (
                      <CheckCircle2 size={16} style={{ flexShrink: 0, opacity: 0.85 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* When to post */}
            <div
              style={{
                background:   'var(--card)',
                border:       '1px solid var(--hair)',
                borderRadius: 14,
                overflow:     'hidden',
              }}
            >
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--hair)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={14} style={{ color: 'var(--ink-3)' }} />
                <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>When to post</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['now', 'schedule'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPostMode(m)}
                      style={{
                        flex:         1,
                        padding:      '10px',
                        borderRadius: 9,
                        border:       `1px solid ${postMode === m ? 'var(--ink)' : 'var(--hair-2)'}`,
                        background:   postMode === m ? 'var(--ink)' : 'transparent',
                        color:        postMode === m ? 'var(--paper)' : 'var(--ink-2)',
                        fontFamily:   'var(--sans)',
                        fontWeight:   600,
                        fontSize:     13.5,
                        cursor:       'pointer',
                        transition:   'all .14s',
                      }}
                    >
                      {m === 'now' ? 'Post now' : 'Schedule'}
                    </button>
                  ))}
                </div>
                {postMode === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={e => setScheduleAt(e.target.value)}
                    style={{
                      width:        '100%',
                      fontFamily:   'var(--sans)',
                      fontSize:     14,
                      color:        'var(--ink)',
                      background:   'var(--card)',
                      border:       '1px solid var(--hair-2)',
                      borderRadius: 9,
                      padding:      '10px 12px',
                      outline:      'none',
                      boxSizing:    'border-box',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Export / posting progress */}
            {(exporting || exportStep) && (
              <div
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  padding:      '12px 16px',
                  borderRadius: 10,
                  background:   'var(--paper-2)',
                  border:       '1px solid var(--hair)',
                  fontSize:     13.5,
                  color:        'var(--ink-2)',
                }}
              >
                <Loader2 size={14} className="animate-spin" style={{ flexShrink: 0, color: 'var(--b)' }} />
                <span>{exportStep || 'Processing…'}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  padding:      '12px 16px',
                  borderRadius: 10,
                  background:   'var(--a-soft)',
                  border:       '1px solid var(--a-line)',
                  fontSize:     13.5,
                  color:        'var(--a-ink)',
                }}
              >
                {error}
              </div>
            )}

            {/* Post button */}
            <Button
              variant="b"
              size="lg"
              onClick={publish}
              disabled={busy || (postMode === 'schedule' && !scheduleAt)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {busy ? (
                <><Loader2 size={16} className="animate-spin" />
                  {exporting ? 'Rendering slides…' : 'Posting…'}</>
              ) : (
                <><ImageIcon size={15} /><LinkedInIcon size={15} /> Render &amp; Post to LinkedIn</>
              )}
            </Button>

            <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', margin: 0 }}>
              Slides are rendered at 1080×1350 px then uploaded to LinkedIn
            </p>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginTop:      36,
            paddingTop:     24,
            borderTop:      '1px solid var(--hair)',
          }}
        >
          <Button variant="ghost" onClick={() => router.push('/linkedin/preview')} disabled={busy}>
            <ChevronLeft size={15} /> Back to Preview
          </Button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {jobs.length} jobs · {jobs.length + 2} slides
          </div>
        </div>

      </div>
    </>
  )
}
