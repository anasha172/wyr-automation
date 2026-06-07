'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles, Send, CheckCircle2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode, type DemoCampaign, type DemoIdea } from '@/lib/demo-store'
import { useUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { WyrIdeaCard } from '@/components/wyr-idea-card'
import { FlowHeader } from '@/components/flow-header'
import { ManagerPickerModal } from '@/components/manager-picker-modal'
import type { ManagerInfo } from '@/app/api/managers/route'

const CAMPAIGN_IDEA_COUNT = 5

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IdeasPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const user    = useUser()
  const role      = user?.role ?? 'publisher'
  const isManager = role === 'manager'

  const [campaign,        setCampaign]        = useState<DemoCampaign | null>(null)
  const [ideas,           setIdeas]           = useState<DemoIdea[]>([])
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [loadingApproval, setLoadingApproval] = useState(false)
  const [regeneratingId,  setRegeneratingId]  = useState<string | null>(null)
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set())
  const [pickerOpen,      setPickerOpen]      = useState(false)
  const [managerMap,      setManagerMap]      = useState<Record<string, string>>({})

  // ── Supabase-mode sent-state (localStorage) ─────────────────
  const localSentKey = `ideas_sent_${id}`

  function getLocalSent(): Set<string> {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem(localSentKey) ?? '[]')) } catch { return new Set() }
  }
  function saveLocalSent(set: Set<string>) {
    if (typeof window === 'undefined') return
    localStorage.setItem(localSentKey, JSON.stringify([...set]))
  }

  const [localSentIds, setLocalSentIds] = useState<Set<string>>(new Set())

  // ── Data load ────────────────────────────────────────────────
  const loadData = useCallback(() => {
    if (isDemoMode) {
      setCampaign(demoStore.campaigns.get(id))
      setIdeas(demoStore.ideas.getByCampaign(id))
    } else {
      const supabase = createClient()
      Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('wyr_ideas').select('*').eq('campaign_id', id),
      ]).then(([{ data: camp }, { data: ideaData }]) => {
        setCampaign(camp)
        setIdeas(ideaData ?? [])
      })
      setLocalSentIds(getLocalSent())
    }
  }, [id])

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

  useEffect(() => { loadData() }, [loadData])

  // ── Realtime subscription — unchanged ──────────────────────
  useEffect(() => {
    if (isDemoMode) return
    const supabase = createClient()
    const channel  = supabase
      .channel('ideas-' + id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wyr_ideas', filter: `campaign_id=eq.${id}` },
        (payload) => {
          const updated = payload.new as any
          if (updated.approval_status === 'approved') toast.success('✅ Manager approved an idea!')
          else if (updated.approval_status === 'rejected') toast.error('❌ Manager rejected an idea — regenerate and re-send.')
          loadData()
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, loadData])

  // ── Helpers ─────────────────────────────────────────────────
  function isSentToManager(idea: DemoIdea): boolean {
    if (isDemoMode) return idea.sent_to_manager === true
    return localSentIds.has(idea.id)
  }

  // ── Derived state ───────────────────────────────────────────
  const sentCount     = ideas.filter(isSentToManager).length
  const approvedCount = ideas.filter(i => i.approval_status === 'approved').length
  const draftIdeas    = ideas.filter(i => !isSentToManager(i) && i.approval_status !== 'approved')
  const rejectedIdeas = ideas.filter(i => i.approval_status === 'rejected')
  const allApproved   = ideas.length === CAMPAIGN_IDEA_COUNT && ideas.every(i => i.approval_status === 'approved')
  const currentStage  = isDemoMode
    ? (demoStore.campaigns.get(id)?.stage ?? campaign?.stage ?? '')
    : (campaign?.stage ?? '')

  // ── Selection ───────────────────────────────────────────────
  function toggleSelect(ideaId: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(ideaId); else next.delete(ideaId)
      return next
    })
  }
  function selectAll() { setSelectedIds(new Set(draftIdeas.map(i => i.id))) }

  // ── Generate — unchanged logic ──────────────────────────────
  async function generateIdeas() {
    if (!campaign) return
    setLoadingGenerate(true)
    try {
      const res  = await fetch('/api/generate-ideas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ campaignId: id, theme: campaign.theme, tone: campaign.tone, audience: campaign.audience, demoMode: isDemoMode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (isDemoMode) {
        const rows = data.ideas.map((idea: any) => ({
          campaign_id: id, option_a: idea.option_a, option_b: idea.option_b,
          approval_status: 'pending' as const, sent_to_manager: false,
        }))
        const allIdeas = JSON.parse(localStorage.getItem('demo_ideas') ?? '[]')
        localStorage.setItem('demo_ideas', JSON.stringify(allIdeas.filter((i: DemoIdea) => i.campaign_id !== id)))
        setIdeas(demoStore.ideas.insertMany(rows))
        demoStore.campaigns.update({ stage: 'ideas_pending' }, id)
      } else {
        setIdeas(data.ideas)
        saveLocalSent(new Set())
        setLocalSentIds(new Set())
      }
      setSelectedIds(new Set())
      toast.success('5 ideas generated!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingGenerate(false)
    }
  }

  // ── Regenerate one idea — unchanged logic ───────────────────
  async function regenerateIdea(ideaId: string) {
    if (!campaign) return
    setRegeneratingId(ideaId)
    try {
      const res  = await fetch('/api/generate-ideas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ campaignId: id, theme: campaign.theme, tone: campaign.tone, audience: campaign.audience, regenerate: true, demoMode: isDemoMode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (isDemoMode) {
        demoStore.ideas.update({ option_a: data.idea.option_a, option_b: data.idea.option_b, approval_status: 'pending', sent_to_manager: false }, ideaId)
      } else {
        const supabase = createClient()
        await supabase.from('wyr_ideas').update({
          title:        data.idea.title ?? null,
          option_a:     data.idea.option_a,
          option_b:     data.idea.option_b,
          why_it_works: data.idea.why_it_works ?? null,
          approval_status: 'pending',
        }).eq('id', ideaId)
        setLocalSentIds(prev => {
          const next = new Set(prev)
          next.delete(ideaId)
          saveLocalSent(next)
          return next
        })
      }
      setIdeas(prev => prev.map(i =>
        i.id === ideaId ? { ...i, ...data.idea, approval_status: 'pending' as const, sent_to_manager: false } : i
      ))
      setSelectedIds(prev => new Set([...prev, ideaId]))
      toast.success('Idea regenerated — select it and send to manager')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRegeneratingId(null)
    }
  }

  // ── Edit in-place — unchanged logic ────────────────────────
  async function updateIdea(ideaId: string, option_a: string, option_b: string) {
    if (isDemoMode) {
      demoStore.ideas.update({ option_a, option_b }, ideaId)
    } else {
      const supabase = createClient()
      await supabase.from('wyr_ideas').update({ option_a, option_b }).eq('id', ideaId)
    }
  }

  // ── Send selected — opens manager picker ───────────────────
  function sendSelected() {
    if (selectedIds.size === 0) { toast.error('Select at least one idea to send.'); return }
    if (isDemoMode) { sendToManager(null); return } // demo: skip picker
    setPickerOpen(true)
  }

  async function sendToManager(manager: ManagerInfo | null) {
    setPickerOpen(false)
    const toSend = ideas.filter(i => selectedIds.has(i.id))

    if (isDemoMode) {
      setLoadingApproval(true)
      try {
        toSend.forEach(idea => { demoStore.ideas.update({ approval_status: 'approved', sent_to_manager: true }, idea.id) })
        setIdeas(prev => prev.map(i =>
          selectedIds.has(i.id) ? { ...i, approval_status: 'approved' as const, sent_to_manager: true } : i
        ))
        setSelectedIds(new Set())
        const remaining = CAMPAIGN_IDEA_COUNT - (sentCount + toSend.length)
        if (remaining <= 0) {
          demoStore.campaigns.update({ stage: 'ideas_approved' }, id)
          setCampaign(c => c ? { ...c, stage: 'ideas_approved' } : c)
          toast.success(`Demo: ${toSend.length} idea${toSend.length > 1 ? 's' : ''} auto-approved! All done ✅`)
        } else {
          toast.success(`Demo: ${toSend.length} idea${toSend.length > 1 ? 's' : ''} auto-approved! ${remaining} still pending.`)
        }
      } finally { setLoadingApproval(false) }
      return
    }

    setLoadingApproval(true)
    try {
      const res  = await fetch('/api/send-approval', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          campaignId:     id,
          type:           'ideas',
          managerId:      manager?.id ?? null,
          managerEmail:   manager?.email ?? '',
          specificIdeaIds: toSend.map(i => i.id),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setLocalSentIds(prev => {
        const next = new Set([...prev, ...toSend.map(i => i.id)])
        saveLocalSent(next)
        return next
      })
      setSelectedIds(new Set())
      const newSentCount = sentCount + toSend.length
      const remaining    = CAMPAIGN_IDEA_COUNT - newSentCount
      toast.success(
        remaining > 0
          ? `${toSend.length} idea${toSend.length > 1 ? 's' : ''} sent to ${manager?.full_name ?? 'manager'}! ${remaining} still to go.`
          : `All ${CAMPAIGN_IDEA_COUNT} ideas sent to ${manager?.full_name ?? 'manager'} ✅`
      )
    } catch (err: any) {
      toast.error(err.message)
    } finally { setLoadingApproval(false) }
  }

  // ── Manager approve / reject ────────────────────────────────
  async function managerApprove(ideaId: string) {
    const updatedIdeas = ideas.map(i =>
      i.id === ideaId ? { ...i, approval_status: 'approved' as const } : i
    )
    if (isDemoMode) {
      demoStore.ideas.update({ approval_status: 'approved' }, ideaId)
      setIdeas(updatedIdeas)
      if (updatedIdeas.every(i => i.approval_status === 'approved')) {
        demoStore.campaigns.update({ stage: 'ideas_approved' }, id)
        setCampaign(c => c ? { ...c, stage: 'ideas_approved' } : c)
      }
      toast.success('Idea approved')
    } else {
      const supabase = createClient()
      await supabase.from('wyr_ideas').update({ approval_status: 'approved' }).eq('id', ideaId)
      toast.success('Idea approved')
      loadData()
    }
  }

  async function managerReject(ideaId: string) {
    if (isDemoMode) {
      demoStore.ideas.update({ approval_status: 'rejected' }, ideaId)
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, approval_status: 'rejected' as const } : i))
    } else {
      const supabase = createClient()
      await supabase.from('wyr_ideas').update({ approval_status: 'rejected' }).eq('id', ideaId)
      loadData()
    }
    toast.error('Idea rejected')
  }

  // ── Render ──────────────────────────────────────────────────
  const hasIdeas = ideas.length > 0

  // Managers only see ideas sent to them; publishers see all
  const visibleIdeas = isManager
    ? ideas.filter(i => isSentToManager(i))
    : ideas

  return (
    <div>
      {/* FlowHeader — campaign context banner */}
      {campaign && (
        <FlowHeader
          theme={campaign.theme}
          stage={currentStage}
          currentStep="ideas"
          tone={campaign.tone}
          audience={campaign.audience}
        />
      )}

      {/* Manager picker modal */}
      <ManagerPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={sendToManager}
        sending={loadingApproval}
        title="Send ideas to manager"
      />

      {/* Page content — narrow container, left-aligned flush after sidebar */}
      <div style={{ padding: '28px 40px 80px', maxWidth: 760 }}>

        {/* ── Manager: nothing sent yet ──────────────────────── */}
        {isManager && !visibleIdeas.length ? (
          <div
            style={{
              padding:      '56px 40px',
              textAlign:    'center',
              background:   'var(--card)',
              border:       '1.5px dashed var(--hair-2)',
              borderRadius: 14,
            }}
          >
            <div
              style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'var(--paper-2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: 'var(--ink-3)',
              }}
            >
              <Send size={26} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500,
                letterSpacing: '-0.02em', color: 'var(--ink)', margin: '0 0 8px',
              }}
            >
              Nothing sent to you yet
            </h2>
            <p style={{ color: 'var(--ink-2)', margin: 0, maxWidth: '38ch', marginInline: 'auto' }}>
              The publisher hasn't sent any ideas for your review on this campaign.
            </p>
          </div>
        ) : !hasIdeas ? (
          <div
            style={{
              padding:      '56px 40px',
              textAlign:    'center',
              background:   'var(--card)',
              border:       '1.5px dashed var(--hair-2)',
              borderRadius: 14,
            }}
          >
            {/* Spark icon box */}
            <div
              style={{
                width:          64,
                height:         64,
                borderRadius:   16,
                background:     'var(--a-soft)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                margin:         '0 auto 20px',
                color:          'var(--a)',
              }}
            >
              <Sparkles size={28} />
            </div>

            <h2
              style={{
                fontFamily:    'var(--serif)',
                fontSize:      28,
                fontWeight:    500,
                letterSpacing: '-0.02em',
                color:         'var(--ink)',
                margin:        '0 0 8px',
              }}
            >
              Five questions, one click
            </h2>

            <p style={{ color: 'var(--ink-2)', margin: '0 auto 22px', maxWidth: '42ch' }}>
              We'll draft five "Would You Rather" duels for{' '}
              <em style={{ fontFamily: 'var(--serif)' }}>{campaign?.theme}</em>{' '}
              in your chosen tone.
            </p>

            <Button variant="ink" size="lg" onClick={generateIdeas} disabled={loadingGenerate}>
              <Sparkles size={16} />
              {loadingGenerate ? 'Generating…' : 'Generate 5 Ideas'}
            </Button>
          </div>
        ) : (
          <>
            {/* ── Approval progress strip ────────────────────── */}
            <div
              style={{
                background:   'var(--card)',
                border:       '1px solid var(--hair)',
                borderRadius: 14,
                overflow:     'hidden',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'center',
                  padding:        '12px 18px',
                }}
              >
                {/* Label */}
                <span
                  style={{
                    fontFamily:    'var(--mono)',
                    fontSize:      11,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color:         'var(--ink-2)',
                  }}
                >
                  Approval progress
                </span>

                {/* Right: approval link + count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {sentCount > 0 && (
                    <a
                      href={`/approval/${id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:        'inline-flex',
                        alignItems:     'center',
                        gap:            5,
                        fontFamily:     'var(--sans)',
                        fontSize:       13,
                        fontWeight:     500,
                        color:          'var(--ink-3)',
                        textDecoration: 'none',
                        transition:     'color .14s',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-3)')}
                    >
                      <ExternalLink size={13} />
                      Approval link
                    </a>
                  )}

                  {/* "3 / 5 approved" — serif number */}
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 16, whiteSpace: 'nowrap', color: 'var(--ink)' }}>
                    {approvedCount}
                    <span style={{ color: 'var(--ink-3)' }}> / {CAMPAIGN_IDEA_COUNT} approved</span>
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 4, background: 'var(--paper-2)' }}>
                <div
                  style={{
                    height:     '100%',
                    width:      `${(approvedCount / CAMPAIGN_IDEA_COUNT) * 100}%`,
                    background: 'var(--go)',
                    transition: 'width .5s',
                  }}
                />
              </div>
            </div>

            {/* ── Idea cards ─────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visibleIdeas.map((idea, i) => (
                <WyrIdeaCard
                  key={idea.id}
                  idea={{ ...idea, sent_to_manager: isSentToManager(idea) }}
                  index={i}
                  onUpdate={updateIdea}
                  onRegenerate={regenerateIdea}
                  loading={regeneratingId === idea.id}
                  readOnly={false}
                  selectable={true}
                  selected={selectedIds.has(idea.id)}
                  onSelect={toggleSelect}
                  role={role}
                  onApprove={managerApprove}
                  onReject={managerReject}
                  managerName={managerMap[(idea as any).assigned_manager_id] ?? undefined}
                />
              ))}
            </div>

            {/* ── Action bar (publisher only, draft ideas exist) ── */}
            {role === 'publisher' && draftIdeas.length > 0 && (
              <div
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        10,
                  marginTop:  20,
                  flexWrap:   'wrap',
                }}
              >
                {/* Select all drafts */}
                {selectedIds.size < draftIdeas.length && (
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select all drafts ({draftIdeas.length})
                  </Button>
                )}

                {/* Send to manager — flame CTA */}
                <Button
                  variant="a"
                  onClick={sendSelected}
                  disabled={loadingApproval || selectedIds.size === 0}
                >
                  <Send size={14} />
                  {loadingApproval
                    ? 'Sending…'
                    : selectedIds.size === 0
                      ? 'Select ideas to send'
                      : isDemoMode
                        ? `Auto-Approve ${selectedIds.size} idea${selectedIds.size > 1 ? 's' : ''} (Demo)`
                        : `Send ${selectedIds.size} to Manager`}
                </Button>
              </div>
            )}

            {/* ── Rejected notice ────────────────────────────── */}
            {rejectedIdeas.length > 0 && (
              <div
                style={{
                  marginTop:    16,
                  padding:      '12px 16px',
                  background:   'var(--paper-2)',
                  border:       '1px solid var(--a-line)',
                  borderRadius: 12,
                  fontSize:     13,
                  color:        'var(--a-ink)',
                }}
              >
                {rejectedIdeas.length} idea{rejectedIdeas.length > 1 ? 's' : ''} rejected —
                hit ↻ on the card to regenerate, then select and re-send.
              </div>
            )}

            {/* ── All approved banner — publishers only ──────── */}
            {allApproved && isManager && (
              <div
                style={{
                  marginTop:    22,
                  padding:      '18px 22px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          12,
                  background:   'var(--go-soft)',
                  border:       '1px solid color-mix(in oklab, var(--go) 30%, white)',
                  borderRadius: 14,
                }}
              >
                <CheckCircle2 size={22} style={{ color: 'var(--go-ink)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>All ideas approved</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
                    The publisher will now move to image selection. You're done here.
                  </div>
                </div>
              </div>
            )}

            {allApproved && role === 'publisher' && (
              <div
                style={{
                  marginTop:      22,
                  padding:        '18px 22px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  gap:            16,
                  background:     'var(--go-soft)',
                  border:         '1px solid color-mix(in oklab, var(--go) 30%, white)',
                  borderRadius:   14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircle2 size={22} style={{ color: 'var(--go-ink)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>All five ideas approved</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
                      Time to find imagery for each option.
                    </div>
                  </div>
                </div>
                {!['images_approved','stories_pending','stories_approved','design_ready','posted'].includes(campaign?.stage ?? '') && (
                  <Button variant="go" onClick={() => router.push(`/campaigns/${id}/images`)}>
                    Find Images →
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
