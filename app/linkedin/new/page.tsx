'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  RefreshCw, X, GripVertical, AlertCircle,
  ChevronRight, Sheet,
} from 'lucide-react'
import { LinkedInIcon } from '@/components/linkedin/linkedin-icon'
import { Button } from '@/components/ui/button'
import type { JobRow } from '@/lib/linkedin-types'

// ─── Draggable job row ────────────────────────────────────────────────────────

function JobCard({
  job,
  index,
  onRemove,
}: {
  job:      JobRow
  index:    number
  onRemove: (rowIndex: number) => void
}) {
  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          16,
        padding:      '16px 20px',
        background:   'var(--card)',
        border:       '1px solid var(--hair)',
        borderRadius: 12,
        transition:   'box-shadow .14s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Drag handle */}
      <span style={{ color: 'var(--ink-3)', cursor: 'grab', display: 'flex', flexShrink: 0 }}>
        <GripVertical size={18} />
      </span>

      {/* Index */}
      <span
        style={{
          fontFamily:    'var(--mono)',
          fontSize:      13,
          fontWeight:    700,
          color:         'var(--ink-3)',
          width:         24,
          flexShrink:    0,
          textAlign:     'center',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Job info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily:    'var(--serif)',
            fontSize:      17,
            fontWeight:    500,
            color:         'var(--ink)',
            letterSpacing: '-0.01em',
            whiteSpace:    'nowrap',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
          }}
        >
          {job.title}
        </div>
        <div
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      11,
            color:         'var(--ink-3)',
            marginTop:     3,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {job.company} · {job.jobType} · {job.location} · {job.city}, {job.country}
        </div>
      </div>

      {/* Job type pill */}
      <span
        style={{
          fontFamily:    'var(--mono)',
          fontSize:      10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding:       '4px 10px',
          borderRadius:  6,
          background:    'oklch(0.955 0.045 78)',
          color:         'oklch(0.54 0.13 72)',
          border:        '1px solid oklch(0.86 0.09 72)',
          flexShrink:    0,
        }}
      >
        {job.jobType}
      </span>

      {/* Remove */}
      <button
        onClick={() => onRemove(job.rowIndex)}
        style={{
          width:          32,
          height:         32,
          borderRadius:   8,
          border:         '1px solid var(--hair-2)',
          background:     'transparent',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          'var(--ink-3)',
          flexShrink:     0,
          transition:     'all .14s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background   = 'var(--a-soft)'
          e.currentTarget.style.borderColor  = 'var(--a-line)'
          e.currentTarget.style.color        = 'var(--a-ink)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.borderColor = 'var(--hair-2)'
          e.currentTarget.style.color       = 'var(--ink-3)'
        }}
        aria-label="Remove job"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LinkedInNewPage() {
  const router = useRouter()

  const [jobs,    setJobs]    = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [source,  setSource]  = useState<'sheet' | 'mock' | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/linkedin/fetch-jobs')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch jobs')
      setJobs(data.jobs)
      setSource(data.source)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  function removeJob(rowIndex: number) {
    setJobs(prev => prev.filter(j => j.rowIndex !== rowIndex))
  }

  function proceed() {
    // Persist selected jobs in sessionStorage so the preview page can read them
    sessionStorage.setItem('linkedin_jobs', JSON.stringify(jobs))
    router.push('/linkedin/preview')
  }

  return (
    <div style={{ padding: '28px 40px 80px', maxWidth: 760 }}>

      {/* ── Masthead ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
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
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>01</span>
          {'  '}LinkedIn · Jobs
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
          New post
        </h1>

        <p style={{ color: 'var(--ink-2)', fontSize: 15.5, marginTop: 12 }}>
          Fetching up to 5 unposted jobs from your Google Sheet.
          Remove or reorder before generating slides.
        </p>
      </div>

      {/* ── Channel card ──────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <span
          style={{
            display:       'block',
            fontFamily:    'var(--mono)',
            fontSize:      10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         'var(--ink-3)',
            marginBottom:  10,
          }}
        >
          Channel
        </span>
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          12,
            padding:      '14px 16px',
            background:   'var(--card)',
            border:       '2px solid var(--ink)',
            borderRadius: 14,
          }}
        >
          <div
            style={{
              width:          40,
              height:         40,
              borderRadius:   10,
              background:     'var(--ink)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
            }}
          >
            <span style={{ color: 'var(--paper)', display: 'flex' }}><LinkedInIcon size={18} /></span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>LinkedIn</div>
            <div
              style={{
                fontFamily:    'var(--mono)',
                fontSize:      11,
                color:         'var(--ink-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop:     2,
              }}
            >
              Carousel · 1:1
            </div>
          </div>
          {/* Selected radio indicator */}
          <div
            style={{
              width:        20,
              height:       20,
              borderRadius: '50%',
              border:       '6px solid var(--ink)',
              flexShrink:   0,
            }}
          />
        </div>
      </div>

      {/* ── Source banner ─────────────────────────────────────── */}
      {source === 'mock' && !loading && (
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            padding:      '10px 16px',
            borderRadius: 10,
            background:   'var(--pending-soft)',
            border:       '1px solid oklch(0.86 0.09 72)',
            marginBottom: 20,
            fontSize:     13.5,
            color:        'oklch(0.54 0.13 72)',
          }}
        >
          <AlertCircle size={15} />
          <span>
            <strong>Demo data</strong> — Google Sheets not yet connected.
            Connect in{' '}
            <a href="/settings" style={{ color: 'inherit', fontWeight: 600 }}>Settings</a>
            {' '}to use real job listings.
          </span>
        </div>
      )}

      {/* ── Sheet connection card ────────────────────────────── */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          14,
          padding:      '14px 18px',
          background:   'var(--card)',
          border:       '1px solid var(--hair)',
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <span style={{ display: 'flex', color: source === 'sheet' ? 'var(--go)' : 'var(--ink-3)' }}>
          <Sheet size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
            {source === 'sheet' ? 'Google Sheet connected' : 'Google Sheet — not connected'}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
            {source === 'sheet' ? `${jobs.length} unposted job${jobs.length !== 1 ? 's' : ''} found` : 'Using demo data · Connect in Settings'}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchJobs}
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* ── Job list ──────────────────────────────────────────── */}
      {loading ? (
        // Skeleton
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 0.7, 0.45].map((op, i) => (
            <div
              key={i}
              style={{
                height:       72,
                borderRadius: 12,
                background:   'var(--paper-2)',
                border:       '1px solid var(--hair)',
                opacity:      op,
              }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            padding:      '32px 24px',
            textAlign:    'center',
            color:        'var(--ink-3)',
            border:       '1px solid var(--hair)',
            borderRadius: 12,
            background:   'var(--card)',
          }}
        >
          <AlertCircle size={28} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontWeight: 500, color: 'var(--ink-2)', marginBottom: 14 }}>{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchJobs}>
            <RefreshCw size={13} /> Try again
          </Button>
        </div>
      ) : jobs.length === 0 ? (
        <div
          style={{
            padding:      '48px 24px',
            textAlign:    'center',
            border:       '1px solid var(--hair)',
            borderRadius: 12,
            background:   'var(--card)',
          }}
        >
          <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>📋</span>
          <p style={{ fontWeight: 500, color: 'var(--ink-2)', marginBottom: 6 }}>
            No unposted jobs found
          </p>
          <p style={{ color: 'var(--ink-3)', fontSize: 13.5, maxWidth: '36ch', margin: '0 auto 20px' }}>
            All jobs in the sheet have been posted, or the sheet is empty.
          </p>
          <Button variant="ghost" size="sm" onClick={fetchJobs}>
            <RefreshCw size={13} /> Refresh sheet
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map((job, i) => (
            <JobCard key={job.rowIndex} job={job} index={i} onRemove={removeJob} />
          ))}
        </div>
      )}

      {/* ── Warning: fewer than 5 ─────────────────────────────── */}
      {!loading && jobs.length > 0 && jobs.length < 5 && (
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            marginTop:    14,
            padding:      '10px 16px',
            borderRadius: 10,
            background:   'var(--b-soft)',
            border:       '1px solid var(--b-line)',
            fontSize:     13.5,
            color:        'var(--b-ink)',
          }}
        >
          <AlertCircle size={14} />
          Only {jobs.length} unposted job{jobs.length !== 1 ? 's' : ''} found —
          the carousel will have {jobs.length + 2} slides (intro + {jobs.length} job{jobs.length !== 1 ? 's' : ''} + outro).
        </div>
      )}

      {/* ── Footer actions ────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginTop:      32,
          paddingTop:     24,
          borderTop:      '1px solid var(--hair)',
        }}
      >
        <Button variant="ghost" onClick={() => router.push('/')}>
          Cancel
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ink"
            onClick={proceed}
            disabled={jobs.length === 0 || loading}
          >
            <LinkedInIcon size={15} />
            Continue to Preview
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>

    </div>
  )
}
