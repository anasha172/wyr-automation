'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SlideIntro }  from '@/components/linkedin/slide-intro'
import { SlideJob }    from '@/components/linkedin/slide-job'
import { SlideOutro }  from '@/components/linkedin/slide-outro'
import type { JobRow, JobSlide } from '@/lib/linkedin-types'

// ─── Thumbnail dimensions ─────────────────────────────────────────────────────
// 7 slides × 155 px + 6 gaps × 10 px = 1145 px — fits inside most screens
const PREVIEW_W = 155
const SCALE     = PREVIEW_W / 1080        // ≈ 0.1435
const PREVIEW_H = Math.round(1350 * SCALE) // ≈ 194 px

// ─── Editor modal ─────────────────────────────────────────────────────────────

function EditorModal({
  job,
  onClose,
  onUpdate,
}: {
  job:      JobSlide
  onClose:  () => void
  onUpdate: (rowIndex: number, patch: Partial<JobSlide>) => void
}) {
  const [logoUrl, setLogoUrl] = useState(job.customLogoUrl ?? job.logoUrl ?? '')
  // Local draft — committed on Save
  const drafts = useRef<Partial<JobSlide>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  // Sync when a different job is selected
  useEffect(() => {
    setLogoUrl(job.customLogoUrl ?? job.logoUrl ?? '')
    drafts.current = {}
  }, [job.rowIndex, job.customLogoUrl, job.logoUrl])

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setLogoUrl(url)
      drafts.current.customLogoUrl = url
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    if (Object.keys(drafts.current).length > 0) {
      onUpdate(job.rowIndex, drafts.current)
    }
    onClose()
  }

  function Field({ label, field, value }: { label: string; field: keyof JobSlide; value: string }) {
    return (
      <div>
        <label
          style={{
            display:       'block',
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
            marginBottom:  5,
          }}
        >
          {label}
        </label>
        <input
          key={`${job.rowIndex}-${field}`}
          defaultValue={value}
          style={{
            width:        '100%',
            fontFamily:   'var(--sans)',
            fontSize:     14,
            color:        'var(--ink)',
            background:   'var(--card)',
            border:       '1px solid var(--hair-2)',
            borderRadius: 8,
            padding:      '8px 11px',
            outline:      'none',
            boxSizing:    'border-box',
            transition:   'border-color .14s, box-shadow .14s',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--ink)'
            e.target.style.boxShadow   = '0 0 0 3px color-mix(in oklab, var(--ink) 8%, transparent)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--hair-2)'
            e.target.style.boxShadow   = 'none'
            drafts.current = { ...drafts.current, [field]: e.target.value }
          }}
        />
      </div>
    )
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position:        'fixed',
        inset:           0,
        background:      'rgba(0,0,0,0.45)',
        zIndex:          100,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         24,
      }}
    >
      {/* Modal panel — stop click propagation so backdrop click doesn't fire inside */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:        420,
          maxHeight:    '90vh',
          display:      'flex',
          flexDirection:'column',
          background:   'var(--card)',
          border:       '1px solid var(--hair)',
          borderRadius: 16,
          boxShadow:    '0 24px 64px rgba(0,0,0,0.22)',
          overflow:     'hidden',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-start',
            padding:        '20px 22px 16px',
            borderBottom:   '1px solid var(--hair)',
            flexShrink:     0,
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              Editing slide
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 22, color: 'var(--ink)', marginTop: 3, letterSpacing: '-0.01em' }}>
              {job.company}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: '1px solid var(--hair-2)',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)',
              flexShrink: 0, marginTop: 2,
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 22px', flex: 1 }}>

          {/* Logo section */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
              Company logo
            </div>

            <div
              style={{
                height:         80,
                border:         '1px solid var(--hair)',
                borderRadius:   9,
                background:     'var(--paper-2)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                marginBottom:   8,
                overflow:       'hidden',
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={job.company} style={{ maxHeight: 56, maxWidth: 160, objectFit: 'contain' }} />
              ) : job.logoLoading ? (
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--ink-3)' }} />
              ) : (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  No logo
                </span>
              )}
            </div>

            <input
              type="url"
              placeholder="Paste logo URL…"
              value={logoUrl}
              onChange={e => {
                setLogoUrl(e.target.value)
                drafts.current.customLogoUrl = e.target.value
              }}
              style={{
                width:        '100%',
                fontFamily:   'var(--sans)',
                fontSize:     13,
                color:        'var(--ink)',
                background:   'var(--card)',
                border:       '1px solid var(--hair-2)',
                borderRadius: 8,
                padding:      '7px 10px',
                outline:      'none',
                boxSizing:    'border-box',
                marginBottom: 7,
              }}
            />

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} style={{ width: '100%', justifyContent: 'center' }}>
              <Upload size={12} /> Upload from computer
            </Button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--hair)', margin: '0 0 20px' }} />

          {/* Editable fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Job Title"     field="title"        value={job.title} />
            <Field label="Job Type"      field="jobType"      value={job.jobType} />
            <Field label="Location"      field="location"     value={job.location} />
            <Field label="City"          field="city"         value={job.city} />
            <Field label="Country"       field="country"      value={job.country} />
            <Field label="Description"   field="description"  value={job.description} />
          </div>
        </div>

        {/* Modal footer — Save button */}
        <div
          style={{
            padding:      '14px 22px',
            borderTop:    '1px solid var(--hair)',
            flexShrink:   0,
            display:      'flex',
            gap:          10,
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="ink" onClick={handleSave}>
            <Check size={14} /> Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Slide thumbnail ──────────────────────────────────────────────────────────

function SlideThumb({
  children,
  active,
  label,
  isStatic,
  loading,
  hasError,
  onClick,
}: {
  children:  React.ReactNode
  active:    boolean
  label:     string
  isStatic?: boolean
  loading?:  boolean
  hasError?: boolean
  onClick:   () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <button
        onClick={onClick}
        style={{
          width:        PREVIEW_W,
          height:       PREVIEW_H,
          borderRadius: 9,
          overflow:     'hidden',
          border:       `2px solid ${active ? 'var(--ink)' : 'var(--hair)'}`,
          cursor:       isStatic ? 'default' : 'pointer',
          background:   'var(--paper-2)',
          position:     'relative',
          boxShadow:    active ? '0 0 0 3px color-mix(in oklab, var(--ink) 12%, transparent)' : 'none',
          transition:   'border-color .14s, box-shadow .14s',
          padding:      0,
          flexShrink:   0,
        }}
      >
        {/* Scale wrapper */}
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

        {/* Status badges */}
        {loading && (
          <div style={{ position: 'absolute', bottom: 5, right: 5 }}>
            <Loader2 size={12} className="animate-spin" style={{ color: 'var(--ink-3)' }} />
          </div>
        )}
        {hasError && !loading && (
          <div style={{ position: 'absolute', bottom: 5, right: 5 }}>
            <AlertCircle size={12} style={{ color: 'var(--a)' }} />
          </div>
        )}
        {isStatic && (
          <div
            style={{
              position:       'absolute',
              bottom:         5,
              right:          5,
              width:          18,
              height:         18,
              borderRadius:   '50%',
              background:     'rgba(0,0,0,0.35)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={9} color="#fff" />
          </div>
        )}
        {active && !isStatic && (
          <div
            style={{
              position:       'absolute',
              top:            5,
              right:          5,
              width:          18,
              height:         18,
              borderRadius:   '50%',
              background:     'var(--ink)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}
          >
            <Check size={9} color="var(--paper)" strokeWidth={3} />
          </div>
        )}
      </button>

      <span
        style={{
          fontFamily:    'var(--mono)',
          fontSize:      9.5,
          color:         active ? 'var(--ink)' : 'var(--ink-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight:    active ? 700 : 400,
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LinkedInPreviewPage() {
  const router = useRouter()

  const [jobs,        setJobs]       = useState<JobSlide[]>([])
  const [activeSlide, setActiveSlide] = useState<number | null>(null)
  const [loading,     setLoading]    = useState(true)

  useEffect(() => {
    const raw = sessionStorage.getItem('linkedin_jobs')
    if (!raw) { router.push('/linkedin/new'); return }

    const rows: JobRow[] = JSON.parse(raw)
    const slides: JobSlide[] = rows.map(j => ({
      ...j,
      logoUrl:     null,
      logoLoading: false,
    }))
    setJobs(slides)
    setLoading(false)

    // Logo auto-fetch removed — no companyDomain in sheet.
    // Users can upload a logo manually via the editor panel.
  }, [router])

  function updateJob(rowIndex: number, patch: Partial<JobSlide>) {
    setJobs(prev => prev.map(j => j.rowIndex === rowIndex ? { ...j, ...patch } : j))
  }

  function proceed() {
    sessionStorage.setItem('linkedin_jobs', JSON.stringify(jobs))
    router.push('/linkedin/publish')
  }

  const totalSlides  = jobs.length + 2
  const isJobSlide   = activeSlide !== null && activeSlide > 0 && activeSlide <= jobs.length
  const isStaticSlide = activeSlide === 0 || activeSlide === jobs.length + 1
  const activeJob    = isJobSlide ? jobs[activeSlide! - 1] : null

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--ink-3)' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 40px 80px' }}>

      {/* ── Masthead ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <span
          style={{
            display:       'block',
            fontFamily:    'var(--mono)',
            fontSize:      11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
            marginBottom:  10,
          }}
        >
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>02</span>
          {'  '}LinkedIn · Preview
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
          Slide preview
        </h1>

        <p style={{ color: 'var(--ink-2)', fontSize: 15.5, marginTop: 12 }}>
          {totalSlides} slides · Click any job slide to edit logo or text. Slides 1 and {totalSlides} are static brand slides.
        </p>
      </div>

      {/* ── Full-width slide strip ────────────────────────────── */}
      <div
        style={{
          background:   'var(--card)',
          border:       '1px solid var(--hair)',
          borderRadius: 14,
          padding:      '16px 20px 12px',
          marginBottom: 20,
        }}
      >
        {/* Scrollable slide row */}
        <div
          style={{
            display:        'flex',
            gap:            12,
            overflowX:      'auto',
            paddingBottom:  8,
            scrollSnapType: 'x mandatory',
            // Custom slim scrollbar
            scrollbarWidth: 'thin',
          }}
        >
          {/* Intro */}
          <SlideThumb
            label="Intro"
            active={activeSlide === 0}
            isStatic
            onClick={() => setActiveSlide(activeSlide === 0 ? null : 0)}
          >
            <SlideIntro />
          </SlideThumb>

          {/* Job slides */}
          {jobs.map((job, i) => (
            <SlideThumb
              key={job.rowIndex}
              label={`Job ${i + 1}`}
              active={activeSlide === i + 1}
              loading={job.logoLoading}
              hasError={!job.logoLoading && !job.logoUrl && !job.customLogoUrl}
              onClick={() => setActiveSlide(activeSlide === i + 1 ? null : i + 1)}
            >
              <SlideJob job={job} index={i + 1} />
            </SlideThumb>
          ))}

          {/* Outro */}
          <SlideThumb
            label="Outro"
            active={activeSlide === jobs.length + 1}
            isStatic
            onClick={() => setActiveSlide(activeSlide === jobs.length + 1 ? null : jobs.length + 1)}
          >
            <SlideOutro />
          </SlideThumb>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 18, paddingTop: 4 }}>
          {[
            { label: '1 × Intro (static)',          color: 'var(--ink-3)' },
            { label: `${jobs.length} × Job cards`,  color: 'var(--b-ink)' },
            { label: '1 × Outro (static)',           color: 'var(--ink-3)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: item.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hint bar ─────────────────────────────────────────── */}
      <div
        style={{
          padding:      '12px 18px',
          borderRadius: 10,
          background:   'var(--paper-2)',
          border:       '1px solid var(--hair)',
          fontFamily:   'var(--mono)',
          fontSize:     11,
          color:        'var(--ink-3)',
          textTransform:'uppercase',
          letterSpacing:'0.1em',
        }}
      >
        ↑ Click any job slide to edit logo or text
      </div>

      {/* ── Editor modal (portal-style fixed overlay) ─────────── */}
      {activeJob && (
        <EditorModal
          job={activeJob}
          onClose={() => setActiveSlide(null)}
          onUpdate={updateJob}
        />
      )}

      {/* ── Footer ────────────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginTop:      32,
          paddingTop:     22,
          borderTop:      '1px solid var(--hair)',
        }}
      >
        <Button variant="ghost" onClick={() => router.push('/linkedin/new')}>
          <ChevronLeft size={15} /> Back
        </Button>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={proceed}>
            Skip to Publish
          </Button>
          <Button variant="ink" onClick={proceed}>
            Continue to Publish
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}
