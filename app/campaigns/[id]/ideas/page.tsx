'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode, type DemoCampaign, type DemoIdea } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { WyrIdeaCard } from '@/components/wyr-idea-card'
import { CampaignPipeline } from '@/components/campaign-pipeline'
import { Sparkles, Send } from 'lucide-react'

export default function IdeasPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campaign, setCampaign] = useState<DemoCampaign | null>(null)
  const [ideas, setIdeas] = useState<DemoIdea[]>([])
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [loadingApproval, setLoadingApproval] = useState(false)
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

  // Realtime (only when not in demo mode)
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
        body: JSON.stringify({
          campaignId: id,
          theme: campaign.theme,
          tone: campaign.tone,
          audience: campaign.audience,
          demoMode: isDemoMode,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (isDemoMode) {
        // Clear existing ideas for this campaign then insert new ones
        const existing = demoStore.ideas.getByCampaign(id)
        // Remove old and add new via insertMany
        const rows = data.ideas.map((idea: any) => ({
          campaign_id: id,
          option_a: idea.option_a,
          option_b: idea.option_b,
          approval_status: 'pending' as const,
        }))
        // Overwrite by saving to localStorage directly
        const allIdeas = JSON.parse(localStorage.getItem('demo_ideas') ?? '[]')
        const filtered = allIdeas.filter((i: DemoIdea) => i.campaign_id !== id)
        localStorage.setItem('demo_ideas', JSON.stringify(filtered))
        const newIdeas = demoStore.ideas.insertMany(rows)
        setIdeas(newIdeas)
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
        body: JSON.stringify({
          campaignId: id,
          theme: campaign.theme,
          tone: campaign.tone,
          audience: campaign.audience,
          regenerate: true,
          demoMode: isDemoMode,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (isDemoMode) {
        demoStore.ideas.update({ option_a: data.idea.option_a, option_b: data.idea.option_b }, ideaId)
        setIdeas((prev) => prev.map((i) => (i.id === ideaId ? { ...i, ...data.idea } : i)))
      } else {
        const supabase = createClient()
        await supabase.from('wyr_ideas').update({ option_a: data.idea.option_a, option_b: data.idea.option_b }).eq('id', ideaId)
        setIdeas((prev) => prev.map((i) => (i.id === ideaId ? { ...i, ...data.idea } : i)))
      }
      toast.success('Idea regenerated')
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

  async function sendForApproval() {
    if (isDemoMode) {
      // In demo mode: instantly approve all ideas
      setLoadingApproval(true)
      try {
        ideas.forEach((idea) => {
          demoStore.ideas.update({ approval_status: 'approved' }, idea.id)
        })
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
      const supabase = createClient()
      const { data: settings } = await supabase.from('user_settings').select('manager_email').single()
      if (!settings?.manager_email) throw new Error('Set a manager email in Settings first')

      const res = await fetch('/api/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, type: 'ideas', managerEmail: settings.manager_email }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success(`Approval email sent to ${settings.manager_email}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingApproval(false)
    }
  }

  const allApproved = ideas.length > 0 && ideas.every((i) => i.approval_status === 'approved')
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

      {isDemoMode && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Demo mode: "Send for Approval" will instantly auto-approve all ideas.
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

          <div className="flex gap-3">
            <Button variant="outline" onClick={generateIdeas} disabled={loadingGenerate}>
              <Sparkles size={14} />
              {loadingGenerate ? 'Regenerating…' : 'Regenerate All'}
            </Button>
            <Button onClick={sendForApproval} disabled={loadingApproval}>
              <Send size={14} />
              {loadingApproval ? 'Processing…' : isDemoMode ? 'Auto-Approve (Demo)' : 'Send for Manager Approval'}
            </Button>
          </div>

          {allApproved && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
              <span className="text-green-800 font-semibold">All ideas approved!</span>
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
