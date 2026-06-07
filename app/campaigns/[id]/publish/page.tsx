'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Share2, PlusCircle, ExternalLink, Clock,
  CheckCircle2, XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode, type DemoIdea } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { FlowHeader } from '@/components/flow-header'
import { StoryFrame } from '@/components/story-frame'

// ─── Types ───────────────────────────────────────────────────────────────────

interface IdeaForPublish extends DemoIdea {
  imageA: string | null
  imageB: string | null
}

// ─── Tiny story-status badge (reused from design page pattern) ────────────────

function StoryStatus({ status }: { status?: string }) {
  if (status === 'approved') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--go-ink)', fontWeight: 600, fontSize: 12 }}>
      <CheckCircle2 size={13} /> Approved
    </span>
  )
  if (status === 'rejected') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--a-ink)', fontWeight: 600, fontSize: 12 }}>
      <XCircle size={13} /> Rejected
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--pending)', fontWeight: 600, fontSize: 12 }}>
      <span className="live" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pending)', display: 'inline-block', flexShrink: 0 }} />
      Pending
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublishPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [campaign,      setCampaign]      = useState<any>(null)
  const [ideas,         setIdeas]         = useState<IdeaForPublish[]>([])
  const [postMode,      setPostMode]      = useState<'now' | 'schedule'>('now')
  const [scheduleTime,  setScheduleTime]  = useState('')
  const [loading,       setLoading]       = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [postUrl,       setPostUrl]       = useState<string | null>(null)

  // ── Load — same logic, extended to also fetch manager-pick images ────
  const loadData = useCallback(async () => {
    if (isDemoMode) {
      const camp     = demoStore.campaigns.get(id)
      setCampaign(camp)
      if (camp?.stage === 'posted') setSuccess(true)
      const approved = demoStore.ideas.getByCampaign(id).filter(i => i.approval_status === 'approved')
      const imgs     = demoStore.images.getByCampaign(id)
      const enriched = approved.map(idea => ({
        ...idea,
        imageA: imgs.find(img => img.idea_id === idea.id && img.option === 'a' && img.is_manager_pick)?.image_url ?? null,
        imageB: imgs.find(img => img.idea_id === idea.id && img.option === 'b' && img.is_manager_pick)?.image_url ?? null,
      }))
      setIdeas(enriched)
      const post = demoStore.posts.get(id)
      if (post?.instagram_post_url) setPostUrl(post.instagram_post_url)
    } else {
      const supabase = createClient()
      const [{ data: camp }, { data: ideaData }, { data: imageData }, { data: postData }] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('wyr_ideas').select('*').eq('campaign_id', id).eq('approval_status', 'approved'),
        supabase.from('wyr_images').select('*').eq('campaign_id', id).eq('is_manager_pick', true),
        supabase.from('posts').select('instagram_post_url').eq('campaign_id', id).single(),
      ])
      setCampaign(camp)
      if (camp?.stage === 'posted') setSuccess(true)
      const enriched = (ideaData ?? []).map((idea: any) => ({
        ...idea,
        imageA: (imageData ?? []).find((img: any) => img.idea_id === idea.id && img.option === 'a')?.image_url ?? null,
        imageB: (imageData ?? []).find((img: any) => img.idea_id === idea.id && img.option === 'b')?.image_url ?? null,
      }))
      setIdeas(enriched)
      if (postData?.instagram_post_url) setPostUrl(postData.instagram_post_url)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  // ── Realtime — unchanged ─────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) return
    const supabase = createClient()
    const channel  = supabase
      .channel('publish-stories-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wyr_ideas', filter: `campaign_id=eq.${id}` },
        payload => {
          const updated = payload.new as any
          setIdeas(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i))
          if (updated.story_approval_status === 'approved') toast.success('✅ Story approved!')
          if (updated.story_approval_status === 'rejected') toast.error('❌ Story rejected — go back to compose.')
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  // ── Post — unchanged ─────────────────────────────────────────
  async function handlePost() {
    const imageUrls = ideas.map(i => i.story_image_url).filter(Boolean) as string[]
    if (imageUrls.length === 0) return toast.error('No story images found. Go back to the Design step.')
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1500))
        const fakePostUrl = `https://www.instagram.com/p/demo_${id.slice(0, 8)}/`
        demoStore.posts.upsert({
          campaign_id:          id,
          instagram_post_url:   fakePostUrl,
          instagram_media_id:   `demo_carousel_${id.slice(0, 8)}`,
          posted_at:            new Date().toISOString(),
        })
        demoStore.campaigns.update({ stage: 'posted' }, id)
        setPostUrl(fakePostUrl)
        setSuccess(true)
        toast.success('Demo: Posted as carousel! 🎉')
        return
      }
      const res  = await fetch('/api/post-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId:   id,
          imageUrls,
          scheduleTime: postMode === 'schedule' ? scheduleTime : undefined,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPostUrl(data.instagramPostUrl)
      setSuccess(true)
      toast.success('Posted as Instagram carousel!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived ──────────────────────────────────────────────────
  const composedIdeas       = ideas.filter(i => i.story_image_url)
  const allStoriesApproved  = ideas.length > 0 && ideas.every(i => i.story_approval_status === 'approved')
  const hasPending          = ideas.some(i => !i.story_approval_status || i.story_approval_status === 'pending')

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div>
        {campaign && (
          <FlowHeader theme={campaign.theme} stage={campaign.stage} currentStep="publish" tone={campaign.tone} audience={campaign.audience} />
        )}

        <div
          style={{
            maxWidth:  600,
            margin:    '0 auto',
            padding:   '48px 40px 80px',
            textAlign: 'center',
          }}
        >
          {/* Big green check disc */}
          <div
            style={{
              width:          72,
              height:         72,
              borderRadius:   20,
              background:     'var(--go-soft)',
              color:          'var(--go-ink)',
              border:         '1px solid color-mix(in oklab, var(--go) 30%, white)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              margin:         '0 auto 24px',
            }}
          >
            <CheckCircle2 size={34} />
          </div>

          {/* Eyebrow */}
          <span
            style={{
              display:       'block',
              fontFamily:    'var(--mono)',
              fontSize:      10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'var(--ink-3)',
              marginBottom:  14,
            }}
          >
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>06</span>
            {'  '}Live
          </span>

          {/* Headline */}
          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      44,
              fontWeight:    500,
              letterSpacing: '-0.025em',
              color:         'var(--ink)',
              margin:        '0 0 10px',
              lineHeight:    1.05,
            }}
          >
            It's posted.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color:       'var(--ink-2)',
              fontSize:    15,
              maxWidth:    '44ch',
              margin:      '0 auto 10px',
              lineHeight:  1.55,
            }}
          >
            {isDemoMode
              ? 'In production this would post a carousel of all approved WYR stories to Instagram.'
              : `Your ${composedIdeas.length} "Would You Rather" stories are live as an Instagram carousel.`}
          </p>

          {/* View on Instagram link */}
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
                textDecoration: 'none',
                marginBottom:   32,
                transition:     'opacity .14s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              <ExternalLink size={15} />
              {isDemoMode ? 'View Demo Link' : 'View on Instagram'}
            </a>
          )}

          {/* Posted story carousel row */}
          {composedIdeas.length > 0 && (
            <div
              style={{
                display:        'flex',
                gap:            14,
                justifyContent: 'center',
                flexWrap:       'wrap',
                marginBottom:   36,
              }}
            >
              {composedIdeas.map(idea => (
                <StoryFrame
                  key={idea.id}
                  imageA={idea.imageA}
                  imageB={idea.imageB}
                  optionA={idea.option_a}
                  optionB={idea.option_b}
                  width={120}
                />
              ))}
            </div>
          )}

          {/* CTAs */}
          <div
            style={{
              display:        'flex',
              gap:            12,
              justifyContent: 'center',
              flexWrap:       'wrap',
            }}
          >
            <Button variant="ink" size="lg" onClick={() => router.push('/campaigns/new')}>
              <PlusCircle size={16} />
              Start New Campaign
            </Button>
            <Button variant="ghost" onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── PRE-POST STATE ────────────────────────────────────────────────────────

  return (
    <div>
      {campaign && (
        <FlowHeader theme={campaign.theme} stage={campaign.stage} currentStep="publish" tone={campaign.tone} audience={campaign.audience} />
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 40px 80px' }}>

        {/* Demo notice */}
        {isDemoMode && (
          <div
            style={{
              padding:      '9px 14px',
              background:   'var(--pending-soft)',
              border:       '1px solid color-mix(in oklab, var(--pending) 30%, white)',
              borderRadius: 10,
              fontSize:     12.5,
              color:        'var(--ink-2)',
              marginBottom: 18,
              fontFamily:   'var(--mono)',
              letterSpacing: '0.04em',
            }}
          >
            Demo mode — Instagram posting is simulated. No real post will be made.
          </div>
        )}

        {/* ── Section header ────────────────────────────────── */}
        <div style={{ marginBottom: 22 }}>
          <span
            style={{
              display:       'block',
              fontFamily:    'var(--mono)',
              fontSize:      10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'var(--ink-3)',
              marginBottom:  8,
            }}
          >
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>06</span>
            {'  '}{composedIdeas.length} slide{composedIdeas.length !== 1 ? 's' : ''}
          </span>
          <h2
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      32,
              fontWeight:    500,
              letterSpacing: '-0.02em',
              color:         'var(--ink)',
              margin:        0,
              lineHeight:    1.1,
            }}
          >
            Review &amp; publish
          </h2>
        </div>

        {/* ── Carousel preview card ──────────────────────────── */}
        <div
          style={{
            background:    'var(--card)',
            border:        '1px solid var(--hair)',
            borderRadius:  14,
            boxShadow:     'var(--shadow-sm)',
            padding:       '16px 18px',
            marginBottom:  16,
          }}
        >
          {/* Card header row */}
          <div
            style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              marginBottom:   14,
            }}
          >
            <span
              style={{
                fontFamily:    'var(--mono)',
                fontSize:      11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color:         'var(--ink-2)',
              }}
            >
              Carousel preview
            </span>
            {/* Instagram pill */}
            <span
              style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           5,
                fontFamily:    'var(--mono)',
                fontSize:      11,
                letterSpacing: '0.06em',
                background:    'var(--paper-2)',
                border:        '1px solid var(--hair-2)',
                borderRadius:  99,
                padding:       '3px 10px 3px 8px',
                color:         'var(--ink-2)',
              }}
            >
              <span style={{ color: 'var(--a)', display: 'flex' }}>
                {/* Inline Instagram SVG — lucide-react version may not have it */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </span>
              {composedIdeas.length} × Story
            </span>
          </div>

          {/* Scrollable StoryFrame row */}
          {composedIdeas.length > 0 ? (
            <div
              style={{
                display:    'flex',
                gap:        14,
                overflowX:  'auto',
                paddingBottom: 6,
              }}
            >
              {composedIdeas.map(idea => (
                <div key={idea.id} style={{ flexShrink: 0 }}>
                  <StoryFrame
                    imageA={idea.imageA}
                    imageB={idea.imageB}
                    optionA={idea.option_a}
                    optionB={idea.option_b}
                    width={130}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign:  'center',
                padding:    '24px 0',
                color:      'var(--ink-3)',
                fontFamily: 'var(--mono)',
                fontSize:   11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              No stories composed yet — go back to Design
            </div>
          )}
        </div>

        {/* ── Story approval list ────────────────────────────── */}
        <div
          style={{
            background:    'var(--card)',
            border:        '1px solid var(--hair)',
            borderRadius:  14,
            boxShadow:     'var(--shadow-sm)',
            overflow:      'hidden',
            marginBottom:  16,
          }}
        >
          {/* List header */}
          <div
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         8,
              padding:     '12px 18px',
              borderBottom: '1px solid var(--hair)',
              background:  'var(--paper-2)',
            }}
          >
            <Clock size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>Story approval</span>
            {allStoriesApproved ? (
              <span
                style={{
                  marginLeft:  'auto',
                  display:     'inline-flex',
                  alignItems:  'center',
                  gap:         5,
                  color:       'var(--go-ink)',
                  fontWeight:  600,
                  fontSize:    12.5,
                }}
              >
                <CheckCircle2 size={13} /> All approved
              </span>
            ) : hasPending ? (
              <span
                style={{
                  marginLeft:  'auto',
                  fontFamily:  'var(--mono)',
                  fontSize:    11,
                  color:       'var(--pending)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                awaiting
              </span>
            ) : null}
          </div>

          {/* Per-idea rows */}
          {ideas.map((idea, i) => (
            <div
              key={idea.id}
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         12,
                padding:     '11px 18px',
                borderBottom: i < ideas.length - 1 ? '1px solid var(--hair)' : 'none',
              }}
            >
              {/* Tiny StoryFrame (width=26 → ~46px tall) */}
              {idea.story_image_url && (
                <div style={{ flexShrink: 0 }}>
                  <StoryFrame
                    imageA={idea.imageA}
                    imageB={idea.imageB}
                    optionA={idea.option_a}
                    optionB={idea.option_b}
                    width={26}
                  />
                </div>
              )}

              {/* Option text */}
              <span
                style={{
                  flex:         1,
                  minWidth:     0,
                  fontSize:     13.5,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                  color:        'var(--ink)',
                }}
              >
                <span
                  style={{
                    fontFamily:    'var(--mono)',
                    fontSize:      11,
                    color:         'var(--ink-3)',
                    marginRight:   8,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {idea.option_a}
                {' '}
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-3)' }}>vs</span>
                {' '}
                {idea.option_b}
              </span>

              {/* Status + fix button if rejected */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <StoryStatus status={idea.story_approval_status} />
                {idea.story_approval_status === 'rejected' && (
                  <button
                    type="button"
                    onClick={() => router.push(`/campaigns/${id}/design`)}
                    style={{
                      fontFamily:    'var(--mono)',
                      fontSize:      10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color:         'var(--a-ink)',
                      background:    'var(--a-soft)',
                      border:        '1px solid var(--a-line)',
                      borderRadius:  6,
                      padding:       '3px 8px',
                      cursor:        'pointer',
                    }}
                  >
                    Fix →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── When to post + CTA card ────────────────────────── */}
        <div
          style={{
            background:    'var(--card)',
            border:        '1px solid var(--hair)',
            borderRadius:  14,
            boxShadow:     'var(--shadow-sm)',
            padding:       '18px 20px',
          }}
        >
          {/* Field label */}
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
            When to post
          </span>

          {/* Mode chips — locked while stories are awaiting manager approval */}
          <div
            style={{
              display:      'flex',
              gap:          8,
              marginBottom: postMode === 'schedule' ? 12 : 0,
            }}
          >
            {(['now', 'schedule'] as const).map(m => {
              const active   = postMode === m
              const disabled = hasPending
              return (
                <button
                  key={m}
                  type="button"
                  onClick={disabled ? undefined : () => setPostMode(m)}
                  style={{
                    flex:          1,
                    padding:       '11px',
                    textAlign:     'center',
                    fontFamily:    'var(--sans)',
                    fontSize:      14,
                    fontWeight:    active ? 600 : 500,
                    color:         disabled ? 'var(--ink-3)' : active ? 'var(--ink)' : 'var(--ink-3)',
                    background:    disabled ? 'var(--paper-2)' : active ? 'var(--card)' : 'var(--paper-2)',
                    border:        `1.5px solid ${disabled ? 'var(--hair)' : active ? 'var(--ink)' : 'var(--hair-2)'}`,
                    borderRadius:  10,
                    cursor:        disabled ? 'not-allowed' : 'pointer',
                    boxShadow:     (!disabled && active) ? 'var(--shadow-sm)' : 'none',
                    opacity:       disabled ? 0.5 : 1,
                    transition:    'all .14s',
                  }}
                >
                  {m === 'now' ? 'Post now' : 'Schedule'}
                </button>
              )
            })}
          </div>

          {/* Schedule datetime input */}
          {postMode === 'schedule' && (
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
              style={{
                width:        '100%',
                boxSizing:    'border-box',
                border:       '1.5px solid var(--hair-2)',
                borderRadius: 10,
                padding:      '10px 14px',
                fontSize:     14,
                fontFamily:   'var(--sans)',
                color:        'var(--ink)',
                background:   'var(--paper)',
                outline:      'none',
                marginBottom: 0,
              }}
              onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)')}
              onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--hair-2)')}
            />
          )}

          {/* Flame "Post as Carousel" CTA */}
          <Button
            variant="a"
            size="lg"
            onClick={handlePost}
            disabled={loading || hasPending || composedIdeas.length === 0}
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          >
            <Share2 size={16} />
            {loading
              ? 'Posting…'
              : isDemoMode
                ? `Simulate Carousel Post (Demo)`
                : `Post ${composedIdeas.length} Stories as Carousel`}
          </Button>

          {/* Locked hint — shown whenever stories are still pending */}
          {hasPending && (
            <p
              style={{
                fontFamily:    'var(--mono)',
                fontSize:      11,
                textAlign:     'center',
                color:         'var(--ink-3)',
                marginTop:     10,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Manager must approve all stories first
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
