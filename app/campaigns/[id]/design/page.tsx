'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Wand2, Send, Check, CheckCircle2, XCircle,
  RefreshCw, ThumbsUp, ThumbsDown, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode, type DemoIdea } from '@/lib/demo-store'
import { useUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { FlowHeader } from '@/components/flow-header'
import { StoryFrame } from '@/components/story-frame'
import { ManagerPickerModal } from '@/components/manager-picker-modal'
import type { ManagerInfo } from '@/app/api/managers/route'

// ─── Types ───────────────────────────────────────────────────────────────────

interface IdeaWithImages extends DemoIdea {
  imageA: string | null
  imageB: string | null
}

// ─── StoryStatus badge ────────────────────────────────────────────────────────

function StoryStatus({ status, managerName }: { status?: string; managerName?: string }) {
  const name = managerName
    ? <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}> · {managerName}</span>
    : null
  if (status === 'approved') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--go-ink)', fontWeight: 600, fontSize: 12.5 }}>
      <CheckCircle2 size={14} />Approved{name}
    </span>
  )
  if (status === 'rejected') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--a-ink)', fontWeight: 600, fontSize: 12.5 }}>
      <XCircle size={14} />Rejected{name}
    </span>
  )
  if (status === 'pending') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--pending)', fontWeight: 600, fontSize: 12.5 }}>
      <span className="live" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pending)', display: 'inline-block', flexShrink: 0 }} />
      Pending{name}
    </span>
  )
  return null
}

// ─── Compact option pill ("A" / "B") ─────────────────────────────────────────

function OptTag({ side }: { side: 'a' | 'b' }) {
  const bg  = side === 'a' ? 'var(--a)'     : 'var(--b)'
  const col = side === 'a' ? 'var(--a-ink)' : 'var(--b-ink)'
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      width:          16,
      height:         16,
      borderRadius:   '50%',
      background:     bg,
      color:          '#fff',
      fontFamily:     'var(--mono)',
      fontSize:       9,
      fontWeight:     700,
      flexShrink:     0,
    }}>
      {side.toUpperCase()}
    </span>
  )
}

// ─── Story card placeholder (not yet composed) ────────────────────────────────

function StoryPlaceholder({ width = 118, onClick, loading }: { width?: number; onClick: () => void; loading: boolean }) {
  const h = Math.round(width * 16 / 9)
  return (
    <div
      style={{
        width,
        height:         h,
        borderRadius:   14,
        border:         '1.5px dashed var(--hair-2)',
        background:     'var(--paper-2)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            8,
        flexShrink:     0,
        cursor:         loading ? 'not-allowed' : 'pointer',
        color:          'var(--ink-3)',
        transition:     'all .15s',
      }}
      onClick={loading ? undefined : onClick}
      onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)'; (e.currentTarget as HTMLElement).style.background = 'var(--paper)' } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--hair-2)'; (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)' }}
      title="Click to compose"
    >
      <Wand2 size={20} style={{ animation: loading ? 'spin .7s linear infinite' : 'none' }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
        {loading ? 'Composing…' : 'not composed'}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const user    = useUser()

  const [campaign,        setCampaign]        = useState<any>(null)
  const [ideas,           setIdeas]           = useState<IdeaWithImages[]>([])
  const [composing,       setComposing]       = useState<string | null>(null)
  const [composingAll,    setComposingAll]    = useState(false)
  const [sendingApproval, setSendingApproval] = useState(false)
  const [hasSentApproval, setHasSentApproval] = useState(false)
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set())
  const [approvingStory,  setApprovingStory]  = useState<string | null>(null)
  const [pickerOpen,      setPickerOpen]      = useState(false)
  const [managerMap,      setManagerMap]      = useState<Record<string, string>>({})

  const role      = user?.role ?? 'publisher'
  const isManager = role === 'manager'

  // ── Load — unchanged logic ──────────────────────────────────
  const loadData = useCallback(async () => {
    if (isDemoMode) {
      const camp    = demoStore.campaigns.get(id)
      setCampaign(camp)
      const approved = demoStore.ideas.getByCampaign(id).filter(i => i.approval_status === 'approved')
      const imgs     = demoStore.images.getByCampaign(id)
      const enriched = approved.map(idea => ({
        ...idea,
        imageA: imgs.find(img => img.idea_id === idea.id && img.option === 'a' && img.is_manager_pick)?.image_url ?? null,
        imageB: imgs.find(img => img.idea_id === idea.id && img.option === 'b' && img.is_manager_pick)?.image_url ?? null,
      }))
      setIdeas(enriched)
      const storiesAlreadySentDemo =
        camp?.stage === 'stories_pending' ||
        camp?.stage === 'stories_approved' ||
        enriched.some((i: any) =>
          i.story_approval_status === 'pending' ||
          i.story_approval_status === 'approved' ||
          i.story_approval_status === 'rejected'
        )
      if (storiesAlreadySentDemo) {
        setHasSentApproval(true)
        // Heal demo store stage so dashboard + pipeline reflect current state
        if (camp?.stage !== 'stories_pending' && camp?.stage !== 'stories_approved') {
          demoStore.campaigns.update({ stage: 'stories_pending' }, id)
          setCampaign((prev: any) => prev ? { ...prev, stage: 'stories_pending' } : prev)
        }
      }
    } else {
      const supabase = createClient()
      const [{ data: camp }, { data: ideaData }, { data: imageData }] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('wyr_ideas').select('*').eq('campaign_id', id).eq('approval_status', 'approved'),
        supabase.from('wyr_images').select('*').eq('campaign_id', id).eq('is_manager_pick', true),
      ])
      setCampaign(camp)
      const approved = ideaData ?? []
      const enriched = approved.map((idea: any) => ({
        ...idea,
        imageA: (imageData ?? []).find((img: any) => img.idea_id === idea.id && img.option === 'a')?.image_url ?? null,
        imageB: (imageData ?? []).find((img: any) => img.idea_id === idea.id && img.option === 'b')?.image_url ?? null,
      }))
      setIdeas(enriched)

      // Derive hasSentApproval from TWO signals so it stays correct even when
      // the campaign stage is stale (e.g. DB update failed silently previously):
      //   1. Campaign stage is stories_pending / stories_approved
      //   2. At least one idea already has story_approval_status set (pending/approved/rejected)
      //      — this means the manager was already notified
      const storiesAlreadySent =
        camp?.stage === 'stories_pending' ||
        camp?.stage === 'stories_approved' ||
        enriched.some((i: any) =>
          i.story_approval_status === 'pending' ||
          i.story_approval_status === 'approved' ||
          i.story_approval_status === 'rejected'
        )
      if (storiesAlreadySent) setHasSentApproval(true)

      // Auto-heal campaign stage in DB if ideas say stories are in flight
      // but the campaign stage hasn't been updated yet
      if (
        storiesAlreadySent &&
        camp?.stage !== 'stories_pending' &&
        camp?.stage !== 'stories_approved'
      ) {
        await supabase.from('campaigns').update({ stage: 'stories_pending' }).eq('id', id)
        setCampaign((prev: any) => prev ? { ...prev, stage: 'stories_pending' } : prev)
      }

      if (camp?.stage === 'stories_approved') {
        setIdeas(prev => prev.map(i =>
          i.story_approval_status !== 'rejected' ? { ...i, story_approval_status: 'approved' as const } : i
        ))
      }
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  // ── Fetch manager name lookup (id → full_name) ───────────────
  useEffect(() => {
    if (isDemoMode) return
    fetch('/api/managers')
      .then(r => r.ok ? r.json() : [])
      .then((mgrs: { id: string; full_name: string }[]) => {
        setManagerMap(Object.fromEntries(mgrs.map(m => [m.id, m.full_name])))
      })
      .catch(() => {})
  }, [])

  // ── Realtime — unchanged ────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) return
    const supabase = createClient()
    const channel  = supabase
      .channel('design-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${id}` },
        payload => {
          const updated = payload.new as any
          setCampaign((prev: any) => ({ ...prev, ...updated }))
          if (updated.stage === 'stories_approved') toast.success('🎉 All stories approved! Ready to post.')
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wyr_ideas', filter: `campaign_id=eq.${id}` },
        payload => {
          const updated = payload.new as any
          if (updated.story_approval_status === 'approved') toast.success('✅ Story approved by manager!')
          else if (updated.story_approval_status === 'rejected') toast.error('❌ Story rejected — re-pick images and recompose.')
          setIdeas(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  // ── Compose one story — unchanged ───────────────────────────
  async function composeStory(idea: IdeaWithImages) {
    if (!idea.imageA || !idea.imageB) return toast.error('Missing images for this idea')
    setComposing(idea.id)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 800))
        demoStore.ideas.update({ story_image_url: idea.imageA, story_approval_status: 'pending' }, idea.id)
        setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, story_image_url: idea.imageA!, story_approval_status: 'pending' } : i))
        toast.success('Story composed!')
        return
      }
      const res  = await fetch('/api/compose-story', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: id, ideaId: idea.id, imageUrlA: idea.imageA, imageUrlB: idea.imageB }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, story_image_url: data.publicUrl, story_approval_status: 'pending' } : i))
      toast.success('Story composed!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setComposing(null)
    }
  }

  // ── Compose all — unchanged ─────────────────────────────────
  async function composeAll() {
    setComposingAll(true)
    for (const idea of ideas) {
      if (!idea.story_image_url) await composeStory(idea)
    }
    setComposingAll(false)
    toast.success('All stories composed!')
  }

  // ── Recompose — unchanged ───────────────────────────────────
  async function recomposeStory(idea: IdeaWithImages) {
    if (isDemoMode) {
      demoStore.ideas.update({ story_image_url: undefined, story_approval_status: undefined }, idea.id)
    } else {
      const supabase = createClient()
      await supabase.from('wyr_ideas').update({ story_image_url: null, story_approval_status: 'pending' }).eq('id', idea.id)
    }
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, story_image_url: undefined, story_approval_status: undefined } : i))
    await composeStory({ ...idea, story_image_url: undefined })
  }

  // ── Send for approval — opens manager picker ────────────────
  function sendForApproval() {
    if (selectedIds.size === 0) return toast.error('Select at least one story to send.')
    if (isDemoMode) { doSendApproval(null); return }
    setPickerOpen(true)
  }

  async function doSendApproval(manager: ManagerInfo | null) {
    setPickerOpen(false)
    if (!isDemoMode && !manager) return toast.error('Please select a manager.')
    setSendingApproval(true)
    try {
      const storyIds = Array.from(selectedIds)
      if (isDemoMode) {
        storyIds.forEach(sid => demoStore.ideas.update({ story_approval_status: 'pending' }, sid))
        setIdeas(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, story_approval_status: 'pending' as const } : i))
        setHasSentApproval(true)
        setSelectedIds(new Set())
        toast.success('Demo: Stories sent for approval! ✅')
        return
      }
      const res  = await fetch('/api/send-approval', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          campaignId:   id,
          type:         'stories',
          managerId:    manager!.id,
          managerEmail: manager!.email,
          storyIds,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setIdeas(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, story_approval_status: 'pending' as const } : i))
      setHasSentApproval(true)
      setSelectedIds(new Set())
      setCampaign((c: any) => c ? { ...c, stage: 'stories_pending' } : c)
      toast.success(`${storyIds.length} stor${storyIds.length > 1 ? 'ies' : 'y'} sent to ${manager!.full_name} via Slack!`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSendingApproval(false)
    }
  }

  // ── Manager approve / reject — demo mode added ──────────────
  async function approveStory(ideaId: string) {
    setApprovingStory(ideaId)
    try {
      if (isDemoMode) {
        demoStore.ideas.update({ story_approval_status: 'approved' }, ideaId)
        const updated = ideas.map(i => i.id === ideaId ? { ...i, story_approval_status: 'approved' as const } : i)
        setIdeas(updated)
        if (updated.every(i => i.story_approval_status === 'approved')) {
          demoStore.campaigns.update({ stage: 'stories_approved' }, id)
          setCampaign((c: any) => c ? { ...c, stage: 'stories_approved' } : c)
          toast.success('🎉 All stories approved! Ready to post.')
        } else toast.success('Story approved')
        return
      }
      const supabase = createClient()
      const { error } = await supabase.from('wyr_ideas').update({ story_approval_status: 'approved' }).eq('id', ideaId)
      if (error) throw error
      const updated = ideas.map(i => i.id === ideaId ? { ...i, story_approval_status: 'approved' as const } : i)
      setIdeas(updated)
      if (updated.every(i => i.story_approval_status === 'approved')) {
        await supabase.from('campaigns').update({ stage: 'stories_approved' }).eq('id', id)
        setCampaign((c: any) => c ? { ...c, stage: 'stories_approved' } : c)
        toast.success('🎉 All stories approved! Ready to post.')
      } else toast.success('Story approved')
    } catch (err: any) {
      toast.error(err.message)
    } finally { setApprovingStory(null) }
  }

  async function rejectStory(ideaId: string) {
    setApprovingStory(ideaId)
    try {
      if (isDemoMode) {
        demoStore.ideas.update({ story_approval_status: 'rejected' }, ideaId)
        setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, story_approval_status: 'rejected' as const } : i))
        toast.error('Story rejected — publisher will recompose.')
        return
      }
      const supabase = createClient()
      const { error } = await supabase.from('wyr_ideas').update({ story_approval_status: 'rejected', story_rejection_comment: '' }).eq('id', ideaId)
      if (error) throw error
      await supabase.from('campaigns').update({ stage: 'stories_pending' }).eq('id', id)
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, story_approval_status: 'rejected' as const } : i))
      toast.error('Story rejected — publisher will recompose.')
    } catch (err: any) {
      toast.error(err.message)
    } finally { setApprovingStory(null) }
  }

  async function approveAllStories() {
    try {
      if (isDemoMode) {
        ideas.forEach(i => demoStore.ideas.update({ story_approval_status: 'approved' }, i.id))
        demoStore.campaigns.update({ stage: 'stories_approved' }, id)
        setIdeas(prev => prev.map(i => ({ ...i, story_approval_status: 'approved' as const })))
        setCampaign((c: any) => c ? { ...c, stage: 'stories_approved' } : c)
        toast.success('🎉 All stories approved!')
        return
      }
      const supabase = createClient()
      for (const idea of ideas) {
        if (idea.story_approval_status !== 'approved') {
          await supabase.from('wyr_ideas').update({ story_approval_status: 'approved' }).eq('id', idea.id)
        }
      }
      await supabase.from('campaigns').update({ stage: 'stories_approved' }).eq('id', id)
      setIdeas(prev => prev.map(i => ({ ...i, story_approval_status: 'approved' as const })))
      setCampaign((c: any) => c ? { ...c, stage: 'stories_approved' } : c)
      toast.success('🎉 All stories approved! Ready to post.')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // ── Derived ─────────────────────────────────────────────────
  const allComposed  = ideas.length > 0 && ideas.every(i => i.story_image_url)
  const allApproved  = ideas.length > 0 && ideas.every(i => i.story_approval_status === 'approved')
  const composedCount = ideas.filter(i => i.story_image_url).length
  const isBusy       = composingAll || composing !== null

  // Managers only see stories assigned to them
  const visibleIdeas = isManager
    ? ideas.filter(i => (i as any).story_assigned_manager_id === user?.id)
    : ideas

  // ── Render ──────────────────────────────────────────────────
  return (
    <div>
      {campaign && (
        <FlowHeader theme={campaign.theme} stage={campaign.stage} currentStep="design" tone={campaign.tone} audience={campaign.audience} />
      )}

      <ManagerPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={doSendApproval}
        sending={sendingApproval}
        title="Send stories to manager"
      />

      <div style={{ padding: '28px 40px 80px', maxWidth: 960 }}>

        {/* ── Manager: nothing sent yet ──────────────────────── */}
        {isManager && !visibleIdeas.length && (
          <div
            style={{
              padding: '56px 40px', textAlign: 'center',
              background: 'var(--card)', border: '1.5px dashed var(--hair-2)',
              borderRadius: 14,
            }}
          >
            <p style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', margin: '0 0 8px' }}>
              Nothing sent to you yet
            </p>
            <p style={{ color: 'var(--ink-2)', margin: 0 }}>
              The publisher hasn't sent any stories for your review.
            </p>
          </div>
        )}

        {/* ── Section header ───────────────────────────────────── */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-end',
            marginBottom:   24,
            gap:            16,
          }}
        >
          <div>
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
              <span style={{ color: 'var(--ink)', fontWeight: 700 }}>04</span>
              {'  '}{composedCount} of {ideas.length} composed
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
              Compose the Stories
            </h2>
          </div>

          {/* Right CTA — conditional */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {/* Compose All */}
            {!allComposed && (
              <Button variant="ink" onClick={composeAll} disabled={isBusy}>
                <Wand2 size={15} />
                {composingAll ? 'Composing…' : 'Compose All'}
              </Button>
            )}
            {/* Send Selected to Manager — publisher only, at least 1 selected */}
            {!isManager && (
              <Button
                variant="a"
                onClick={sendForApproval}
                disabled={sendingApproval || selectedIds.size === 0}
              >
                <Send size={15} />
                {sendingApproval
                  ? 'Sending…'
                  : selectedIds.size > 0
                    ? `Send Selected (${selectedIds.size})`
                    : 'Send to Manager'}
              </Button>
            )}
          </div>
        </div>

        {/* ── Empty state ─────────────────────────────────────── */}
        {ideas.length === 0 && (
          <div
            style={{
              padding:      '56px 40px',
              textAlign:    'center',
              background:   'var(--card)',
              border:       '1.5px dashed var(--hair-2)',
              borderRadius: 14,
            }}
          >
            <p style={{ fontWeight: 500, color: 'var(--ink-2)', marginBottom: 6 }}>No approved ideas found.</p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>Get all ideas approved first.</p>
            <Button variant="ghost" onClick={() => router.push(`/campaigns/${id}/ideas`)}>← Back to Ideas</Button>
          </div>
        )}

        {/* ── Story card grid ──────────────────────────────────── */}
        {ideas.length > 0 && (
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap:                 18,
              marginBottom:        22,
            }}
          >
            {(isManager ? visibleIdeas : ideas).map((idea, i) => {
              const status       = idea.story_approval_status as string | undefined
              const isComposed   = !!idea.story_image_url
              const isComposing  = composing === idea.id
              const isApproving  = approvingStory === idea.id

              const borderColor =
                status === 'approved' ? 'color-mix(in oklab, var(--go) 32%, var(--hair))' :
                status === 'rejected' ? 'var(--a-line)' :
                isComposed            ? 'var(--hair)'   :
                'var(--hair-2)'

              return (
                <div
                  key={idea.id}
                  style={{
                    background:    'var(--card)',
                    border:        `1px solid ${borderColor}`,
                    borderRadius:  14,
                    boxShadow:     'var(--shadow-sm)',
                    padding:       16,
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           14,
                    transition:    'border-color .2s',
                  }}
                >
                  {/* ── Card header: eyebrow + checkbox (publisher) + status ── */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontFamily:    'var(--mono)',
                        fontSize:      10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color:         'var(--ink-3)',
                        flexShrink:    0,
                      }}
                    >
                      <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>
                      {' '}Story
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Checkbox — publisher only, composed stories not yet approved */}
                      {!isManager && isComposed && status !== 'approved' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(idea.id)}
                          onChange={e => {
                            setSelectedIds(prev => {
                              const next = new Set(prev)
                              e.target.checked ? next.add(idea.id) : next.delete(idea.id)
                              return next
                            })
                          }}
                          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--a)' }}
                        />
                      )}
                      <StoryStatus status={status} managerName={managerMap[(idea as any).story_assigned_manager_id]} />
                    </div>
                  </div>

                  {/* ── b) Row: 9:16 frame + options-only text col ── */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {isComposed ? (
                      <StoryFrame
                        imageA={idea.imageA}
                        imageB={idea.imageB}
                        optionA={idea.option_a}
                        optionB={idea.option_b}
                        width={118}
                      />
                    ) : (
                      <StoryPlaceholder
                        width={118}
                        loading={isComposing}
                        onClick={() => composeStory(idea)}
                      />
                    )}

                    {/* Options only — no buttons here */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <OptTag side="a" />
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.2, color: 'var(--ink)', marginTop: 2 }}>
                          {idea.option_a}
                        </div>
                      </div>
                      <div>
                        <OptTag side="b" />
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.2, color: 'var(--ink)', marginTop: 2 }}>
                          {idea.option_b}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── c) Full-width action footer — pinned to bottom ── */}
                  <div style={{ marginTop: 'auto' }}>
                  {!isComposed ? (
                    // Not composed → single Compose button
                    <Button
                      variant="ink"
                      size="sm"
                      onClick={() => composeStory(idea)}
                      disabled={isComposing || !idea.imageA || !idea.imageB}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <Wand2 size={13} />
                      {isComposing ? 'Composing…' : 'Compose'}
                    </Button>
                  ) : isManager && status !== 'approved' ? (
                    // Manager: Approve / Reject split 50/50 across full card width
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="go"
                        size="sm"
                        onClick={() => approveStory(idea.id)}
                        disabled={isApproving}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <ThumbsUp size={12} />Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectStory(idea.id)}
                        disabled={isApproving}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <ThumbsDown size={12} />Reject
                      </Button>
                    </div>
                  ) : status === 'rejected' ? (
                    // Publisher: recompose after rejection
                    <button
                      type="button"
                      onClick={() => recomposeStory(idea)}
                      disabled={isComposing}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 500,
                        color: 'var(--ink-3)', background: 'transparent', border: 'none',
                        cursor: isComposing ? 'not-allowed' : 'pointer', padding: 0,
                        alignSelf: 'flex-start', transition: 'color .14s',
                      }}
                      onMouseEnter={e => { if (!isComposing) (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-3)' }}
                    >
                      <RefreshCw size={12} style={{ animation: isComposing ? 'spin .7s linear infinite' : 'none' }} />
                      Recompose
                    </button>
                  ) : status === 'approved' ? (
                    // Approved
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--go-ink)', fontSize: 12.5, fontWeight: 600 }}>
                      <Check size={13} />Story ready
                      {managerMap[(idea as any).story_assigned_manager_id] && (
                        <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>
                          · {managerMap[(idea as any).story_assigned_manager_id]}
                        </span>
                      )}
                    </span>
                  ) : (
                    // Pending — publisher view
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--pending)', fontSize: 12.5, fontWeight: 600 }}>
                      <span className="live" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pending)', flexShrink: 0, display: 'inline-block' }} />
                      Pending
                      {managerMap[(idea as any).story_assigned_manager_id]
                        ? <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}> · {managerMap[(idea as any).story_assigned_manager_id]}</span>
                        : ' review'}
                    </span>
                  )}
                  </div>{/* end pinned footer */}

                  {/* Rejection comment */}
                  {(idea as any).story_rejection_comment && (
                    <div style={{ padding: '7px 10px', background: 'var(--paper-2)', border: '1px solid var(--a-line)', borderRadius: 8, fontSize: 12, color: 'var(--a-ink)', fontStyle: 'italic' }}>
                      Manager: {(idea as any).story_rejection_comment}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Pending approval banner ──────────────────────────── */}
        {hasSentApproval && ideas.length > 0 && !allApproved && (
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              padding:      '14px 20px',
              background:   'var(--pending-soft)',
              border:       '1px solid var(--a-line)',
              borderRadius: 14,
              marginBottom: 20,
              flexWrap:     'wrap',
            }}
          >
            <span
              className="live"
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pending)', flexShrink: 0, display: 'inline-block' }}
            />
            <span style={{ fontWeight: 600, fontSize: 14, flex: 1, color: 'var(--ink)' }}>
              Waiting for manager to approve all stories…
            </span>
            {isManager && (
              <Button variant="go" size="sm" onClick={approveAllStories} style={{ marginLeft: 'auto' }}>
                <CheckCircle2 size={14} /> Approve All
              </Button>
            )}
          </div>
        )}

        {/* ── All approved — manager done banner ──────────────── */}
        {allApproved && isManager && (
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              padding:      '18px 22px',
              background:   'var(--go-soft)',
              border:       '1px solid color-mix(in oklab, var(--go) 30%, white)',
              borderRadius: 14,
            }}
          >
            <CheckCircle2 size={22} style={{ color: 'var(--go-ink)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>All stories approved</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
                The publisher will now schedule and post to Instagram. You're done here.
              </div>
            </div>
          </div>
        )}

        {/* ── All approved — publisher CTA ─────────────────────── */}
        {allApproved && role === 'publisher' && (
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              gap:            16,
              padding:        '18px 22px',
              background:     'var(--go-soft)',
              border:         '1px solid color-mix(in oklab, var(--go) 30%, white)',
              borderRadius:   14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={22} style={{ color: 'var(--go-ink)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>All stories approved</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
                  Ready to publish to Instagram.
                </div>
              </div>
            </div>
            <Button variant="go" onClick={() => router.push(`/campaigns/${id}/publish`)}>
              Post to Instagram →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
