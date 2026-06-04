'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode, type DemoCampaign, type DemoIdea } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { WyrIdeaCard } from '@/components/wyr-idea-card'
import { CampaignPipeline } from '@/components/campaign-pipeline'
import { Sparkles, Send, RefreshCw } from 'lucide-react'

export default function IdeasPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campaign, setCampaign] = useState<DemoCampaign | null>(null)
  const [ideas, setIdeas] = useState<DemoIdea[]>([])
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [loadingApproval, setLoadingApproval] = useState(false)
  const [loadingResend, setLoadingResend] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

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
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  // Realtime subscription
  useEffect(() => {
    if (isDemoMode) return
    const supabase = createClient()
    const channel = supabase
      .channel('ideas-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wyr_ideas', filter: `campaign_id=eq.${id}` }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, loadData])

  async function generateIdeas() {
    if (!campaign) return
    setLoadingGenerate(true)
    try {
      const res = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, theme: campaign.theme, tone: campaign.tone, audience: campaign.audience, demoMode: isDemoMode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (isDemoMode) {
        const rows = data.ideas.map((idea: any) => ({ campaign_id: id, option_a: idea.option_a, option_b: idea.option_b, approval_status: 'pending' as const }))
        const allIdeas = JSON.parse(localStorage.getItem('demo_ideas') ?? '[]')
        localStorage.setItem('demo_ideas', JSON.stringify(allIdeas.filter((i: DemoIdea) => i.campaign_id !== id)))
        setIdeas(demoStore.ideas.insertMany(rows))
        demoStore.campaigns.update({ stage: 'ideas_pending' }, id)
      } else {
        setIdeas(data.ideas)
      }
      toast.success('5 ideas generated!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingGenerate(false)
    }
  }

  async function regenerateIdea(ideaId: string) {
    if (!campaign) return
    setRegeneratingId(ideaId)
    try {
      const res = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, theme: campaign.theme, tone: campaign.tone, audience: campaign.audience, regenerate: true, demoMode: isDemoMode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (isDemoMode) {
        demoStore.ideas.update({ option_a: data.idea.option_a, option_b: data.idea.option_b, approval_status: 'pending' }, ideaId)
      } else {
        const supabase = createClient()
        await supabase.from('wyr_ideas').update({ option_a: data.idea.option_a, option_b: data.idea.option_b, approval_status: 'pending' }).eq('id', ideaId)
      }
      setIdeas((prev) => prev.map((i) => i.id === ideaId ? { ...i, ...data.idea, approval_status: 'pending' as const } : i))
      toast.success('Idea regenerated — ready to re-send')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRegeneratingId(null)
    }
  }

  async function updateIdea(ideaId: string, option_a: string, option_b: string) {
    if (isDemoMode) {
      demoStore.ideas.update({ option_a, option_b }, ideaId)
    } else {
      const supabase = createClient()
      await supabase.from('wyr_ideas').update({ option_a, option_b }).eq('id', ideaId)
    }
  }

  // Send only specific ideas to Slack
  async function sendIdeasToSlack(ideasToSend: DemoIdea[]) {
    const WEBHOOK = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL
    const blocks: any[] = [
      { type: 'header', text: { type: 'plain_text', text: '🤔 WYR Ideas — Re-approval Needed', emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: `*Campaign:* ${campaign?.theme}\nPlease review the updated idea${ideasToSend.length > 1 ? 's' : ''} below:` } },
      { type: 'divider' },
    ]

    ideasToSend.forEach((idea, i) => {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*Idea*\n*A:* ${idea.option_a}\n*B:* ${idea.option_b}` } })
      blocks.push({
        type: 'actions',
        block_id: `idea_${idea.id}`,
        elements: [
          { type: 'button', text: { type: 'plain_text', text: '✅ Approve', emoji: true }, style: 'primary', action_id: 'approve_idea', value: JSON.stringify({ ideaId: idea.id, campaignId: id, action: 'approved' }) },
          { type: 'button', text: { type: 'plain_text', text: '❌ Reject', emoji: true }, style: 'danger', action_id: 'reject_idea', value: JSON.stringify({ ideaId: idea.id, campaignId: id, action: 'rejected' }) },
        ],
      })
      blocks.push({ type: 'divider' })
    })

    const res = await fetch('/api/send-approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: id, type: 'ideas', managerEmail: '' }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
  }

  async function sendForApproval() {
    if (isDemoMode) {
      setLoadingApproval(true)
      try {
        ideas.forEach((idea) => demoStore.ideas.update({ approval_status: 'approved' }, idea.id))
        demoStore.campaigns.update({ stage: 'ideas_approved' }, id)
        setIdeas((prev) => prev.map((i) => ({ ...i, approval_status: 'approved' as const })))
        setCampaign((c) => c ? { ...c, stage: 'ideas_approved' } : c)
        toast.success('Demo: All ideas auto-approved! ✅')
      } finally {
        setLoadingApproval(false)
      }
      return
    }

    setLoadingApproval(true)
    try {
      const res = await fetch('/api/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, type: 'ideas', managerEmail: '' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('All 5 ideas sent to manager via Slack!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingApproval(false)
    }
  }

  async function resendRejectedIdea(ideaId: string) {
    setLoadingResend(true)
    try {
      const idea = ideas.find((i) => i.id === ideaId)
      if (!idea) throw new Error('Idea not found')

      const res = await fetch('/api/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, type: 'ideas', managerEmail: '', specificIdeaId: ideaId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Regenerated idea sent to manager!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingResend(false)
    }
  }

  const allApproved = ideas.length > 0 && ideas.every((i) => i.approval_status === 'approved')
  const rejectedIdeas = ideas.filter((i) => i.approval_status === 'rejected')
  const hasRejected = rejectedIdeas.length > 0
  const currentStage = isDemoMode ? demoStore.campaigns.get(id)?.stage ?? campaign?.stage : campaign?.stage

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {campaign && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
              {campaign.theme}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Ideas</h1>
        {campaign && <CampaignPipeline stage={currentStage ?? campaign.stage} />}
      </div>

      {/* Rejected ideas banner */}
      {hasRejected && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <p className="font-semibold mb-1">⚠️ {rejectedIdeas.length} idea{rejectedIdeas.length > 1 ? 's' : ''} rejected by manager</p>
          <p>Click the ↻ button on the rejected idea to regenerate it, then click <strong>"Re-send to Manager"</strong>.</p>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-4">
          <div className="p-4 bg-purple-50 rounded-2xl">
            <Sparkles size={32} className="text-purple-600" />
          </div>
          <p className="text-gray-500 text-center">Click below to generate 5 WYR ideas using AI</p>
          <Button onClick={generateIdeas} disabled={loadingGenerate} size="lg">
            <Sparkles size={16} />
            {loadingGenerate ? 'Generating…' : 'Generate 5 Ideas'}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {ideas.map((idea, i) => (
              <WyrIdeaCard
                key={idea.id}
                idea={idea}
                index={i}
                onUpdate={updateIdea}
                onRegenerate={regenerateIdea}
                loading={regeneratingId === idea.id}
              />
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Show Send for Approval only when no ideas have been sent yet */}
            {ideas.every(i => i.approval_status === 'pending') && (
              <Button onClick={sendForApproval} disabled={loadingApproval}>
                <Send size={14} />
                {loadingApproval ? 'Sending…' : isDemoMode ? 'Auto-Approve (Demo)' : 'Send All to Manager'}
              </Button>
            )}

            {/* Show Re-send button when there are regenerated (pending) ideas after rejection */}
            {hasRejected === false && ideas.some(i => i.approval_status === 'pending') && ideas.some(i => i.approval_status === 'approved') && (
              <Button onClick={() => {
                const pendingIdea = ideas.find(i => i.approval_status === 'pending')
                if (pendingIdea) resendRejectedIdea(pendingIdea.id)
              }} disabled={loadingResend} variant="outline">
                <RefreshCw size={14} />
                {loadingResend ? 'Sending…' : 'Re-send to Manager'}
              </Button>
            )}
          </div>

          {allApproved && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
              <span className="text-green-800 font-semibold">🎉 All ideas approved!</span>
              <Button variant="success" onClick={() => router.push(`/campaigns/${id}/images`)}>
                Find Images →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
