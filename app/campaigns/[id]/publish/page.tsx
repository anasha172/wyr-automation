'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { CampaignPipeline } from '@/components/campaign-pipeline'
import { Share2, Send, PlusCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PublishPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [campaign, setCampaign] = useState<any>(null)
  const [post, setPost] = useState<any>(null)
  const [idea, setIdea] = useState<any>(null)
  const [postMode, setPostMode] = useState<'now' | 'schedule'>('now')
  const [scheduleTime, setScheduleTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const loadData = useCallback(() => {
    if (isDemoMode) {
      const camp = demoStore.campaigns.get(id)
      setCampaign(camp)
      if (camp?.stage === 'posted') setSuccess(true)
      setPost(demoStore.posts.get(id))
      const approvedIdeas = demoStore.ideas.getByCampaign(id).filter((i) => i.approval_status === 'approved')
      setIdea(approvedIdeas[0] ?? null)
    } else {
      const supabase = createClient()
      Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('posts').select('*').eq('campaign_id', id).single(),
        supabase.from('wyr_ideas').select('*').eq('campaign_id', id).eq('approval_status', 'approved').limit(1).single(),
      ]).then(([{ data: camp }, { data: postData }, { data: ideaData }]) => {
        setCampaign(camp)
        if (camp?.stage === 'posted') setSuccess(true)
        setPost(postData)
        setIdea(ideaData)
      })
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function handlePost() {
    if (!post?.final_image_url) return toast.error('No design found. Go back to the Design step.')
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1500))
        const fakePostUrl = `https://www.instagram.com/p/demo_${id.slice(0, 8)}/`
        demoStore.posts.upsert({
          campaign_id: id,
          instagram_post_url: fakePostUrl,
          instagram_media_id: `demo_media_${id.slice(0, 8)}`,
          posted_at: new Date().toISOString(),
        })
        demoStore.campaigns.update({ stage: 'posted' }, id)
        setPost((p: any) => ({ ...p, instagram_post_url: fakePostUrl }))
        setSuccess(true)
        toast.success('Demo: Posted successfully! 🎉')
        return
      }

      const res = await fetch('/api/post-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, imageUrl: post.final_image_url, scheduleTime: postMode === 'schedule' ? scheduleTime : undefined }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPost((p: any) => ({ ...p, instagram_post_url: data.instagramPostUrl }))
      setSuccess(true)
      toast.success('Posted to Instagram Stories!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isDemoMode ? 'Demo Post Successful!' : 'Posted Successfully!'}
        </h1>
        <p className="text-gray-500 mb-6">
          {isDemoMode ? 'In production this would be live on Instagram.' : 'Your WYR story is now live on Instagram.'}
        </p>
        {post?.instagram_post_url && (
          <a
            href={post.instagram_post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-purple-700 font-semibold hover:underline mb-6"
          >
            <ExternalLink size={16} />
            {isDemoMode ? 'View Demo Link' : 'View on Instagram'}
          </a>
        )}
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={() => router.push('/campaigns/new')} size="lg">
            <PlusCircle size={16} />
            Start New Campaign
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {campaign && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
              {campaign.theme}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Publish to Instagram</h1>
        {campaign && <CampaignPipeline stage={campaign.stage} />}
      </div>

      {isDemoMode && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Demo mode: Instagram posting is simulated. No real post will be made.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Story Preview (9:16)</p>
          <div className="mx-auto" style={{ width: 180, aspectRatio: '9/16' }}>
            {post?.final_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.final_image_url}
                alt="Final story"
                className="w-full h-full object-cover rounded-2xl border border-gray-200 shadow"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-xs text-center px-4">
                No design yet.<br />Complete the Design step first.
              </div>
            )}
          </div>
        </div>

        {idea && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Caption Preview</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
              Would You Rather... {idea.option_a} OR {idea.option_b}? 🤔 Comment below!
              <br />
              <span className="text-gray-400">#wouldyourather #wyr #instagram</span>
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">When to post</p>
          <div className="flex gap-2">
            {(['now', 'schedule'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPostMode(m)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                  postMode === m
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {m === 'now' ? 'Post Now' : 'Schedule'}
              </button>
            ))}
          </div>
          {postMode === 'schedule' && (
            <input
              type="datetime-local"
              className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          )}
        </div>

        <Button className="w-full" size="lg" onClick={handlePost} disabled={loading || !post?.final_image_url}>
          <Share2 size={16} />
          {loading ? 'Posting…' : isDemoMode ? 'Simulate Post (Demo)' : 'Post to Instagram Story'}
        </Button>
      </div>
    </div>
  )
}
