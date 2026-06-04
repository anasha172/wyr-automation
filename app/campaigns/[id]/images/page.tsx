'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { CampaignPipeline } from '@/components/campaign-pipeline'
import { Check, RefreshCw, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageResult {
  image_url: string
  thumbnail_url: string
  title: string
  source_page: string
}

// Demo placeholder images
function getDemoImages(seed: string, count = 6): ImageResult[] {
  return Array.from({ length: count }, (_, i) => ({
    image_url: `https://picsum.photos/seed/${seed}-${i}/600/600`,
    thumbnail_url: `https://picsum.photos/seed/${seed}-${i}/300/300`,
    title: `Image ${i + 1}`,
    source_page: 'https://picsum.photos',
  }))
}

export default function ImagesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [campaign, setCampaign] = useState<any>(null)
  const [idea, setIdea] = useState<any>(null)

  const [imagesA, setImagesA] = useState<ImageResult[]>([])
  const [imagesB, setImagesB] = useState<ImageResult[]>([])
  const [selectedA, setSelectedA] = useState<ImageResult | null>(null)
  const [selectedB, setSelectedB] = useState<ImageResult | null>(null)
  const [queryA, setQueryA] = useState('')
  const [queryB, setQueryB] = useState('')

  const [source, setSource] = useState<'google' | 'pinterest'>('google')
  const [loading, setLoading] = useState(false)
  const [loadingApproval, setLoadingApproval] = useState(false)
  const [imagesApproved, setImagesApproved] = useState(false)

  const loadData = useCallback(() => {
    if (isDemoMode) {
      const camp = demoStore.campaigns.get(id)
      setCampaign(camp)
      if (camp?.stage === 'images_approved') setImagesApproved(true)
      const approved = demoStore.ideas.getByCampaign(id).filter((i) => i.approval_status === 'approved')
      setIdea(approved[0] ?? null)
    } else {
      const supabase = createClient()
      Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('wyr_ideas').select('*').eq('campaign_id', id).eq('approval_status', 'approved').limit(1).single(),
      ]).then(([{ data: camp }, { data: ideaData }]) => {
        setCampaign(camp)
        setIdea(ideaData)
        if (camp?.stage === 'images_approved') setImagesApproved(true)
      })
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  // Auto-search once idea is loaded
  useEffect(() => {
    if (idea && imagesA.length === 0 && imagesB.length === 0) {
      searchImages()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea])

  async function searchImages() {
    if (!idea) return
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1000))
        const demoA = getDemoImages(`${id}-a`)
        const demoB = getDemoImages(`${id}-b`)
        setImagesA(demoA)
        setImagesB(demoB)
        setSelectedA(demoA[0])
        setSelectedB(demoB[0])
        setQueryA(idea.option_a)
        setQueryB(idea.option_b)
      } else {
        const res = await fetch('/api/search-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            optionA: idea.option_a,
            optionB: idea.option_b,
            theme: campaign?.theme ?? '',
            source,
            campaignId: id,
            ideaId: idea.id,
          }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setImagesA(data.resultsA)
        setImagesB(data.resultsB)
        setSelectedA(data.resultsA[0] ?? null)
        setSelectedB(data.resultsB[0] ?? null)
        setQueryA(data.queryA)
        setQueryB(data.queryB)
        toast.success(`Images found — "${data.queryA}" vs "${data.queryB}"`)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function approveAndProceed() {
    if (!selectedA || !selectedB) return toast.error('Please select one image per option')
    setLoadingApproval(true)
    try {
      if (isDemoMode) {
        const rows = [
          { campaign_id: id, idea_id: idea?.id, option: 'a' as const, image_url: selectedA.image_url, thumbnail_url: selectedA.thumbnail_url, source, approval_status: 'pending' as const, is_manager_pick: true },
          { campaign_id: id, idea_id: idea?.id, option: 'b' as const, image_url: selectedB.image_url, thumbnail_url: selectedB.thumbnail_url, source, approval_status: 'pending' as const, is_manager_pick: true },
        ]
        demoStore.images.insertMany(rows)
        demoStore.campaigns.update({ stage: 'images_approved' }, id)
        setImagesApproved(true)
        toast.success('Images approved! ✅')
      } else {
        const supabase = createClient()
        // Save picks to DB
        await supabase.from('wyr_images').upsert([
          { campaign_id: id, idea_id: idea?.id, option: 'a', image_url: selectedA.image_url, thumbnail_url: selectedA.thumbnail_url, source, approval_status: 'approved', is_manager_pick: true },
          { campaign_id: id, idea_id: idea?.id, option: 'b', image_url: selectedB.image_url, thumbnail_url: selectedB.thumbnail_url, source, approval_status: 'approved', is_manager_pick: true },
        ])
        await supabase.from('campaigns').update({ stage: 'images_approved' }).eq('id', id)
        setImagesApproved(true)
        toast.success('Images approved!')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingApproval(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {campaign && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
              {campaign.theme}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Select Images</h1>
        {campaign && <CampaignPipeline stage={campaign.stage} />}
      </div>

      {/* Source toggle + Refresh */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-medium text-gray-500">Image source:</span>
        {(['google', 'pinterest'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize',
              source === s ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {s}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={searchImages} disabled={loading || !idea}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Searching…' : 'Refresh Images'}
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
              <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
              <div className="grid grid-cols-3 gap-2">
                {[0,1,2].map((j) => <div key={j} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-column image selector */}
      {!loading && imagesA.length > 0 && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          {([
            { option: 'a', label: 'Option A', text: idea?.option_a, images: imagesA, selected: selectedA, setSelected: setSelectedA, query: queryA },
            { option: 'b', label: 'Option B', text: idea?.option_b, images: imagesB, selected: selectedB, setSelected: setSelectedB, query: queryB },
          ] as const).map((col) => (
            <div key={col.option} className="bg-white rounded-2xl border border-gray-100 p-4">
              {/* Option label + text */}
              <div className="mb-3">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{col.label}</span>
                <p className="font-semibold text-gray-800 mt-0.5 text-sm">{col.text}</p>
                {col.query && (
                  <p className="text-xs text-gray-400 mt-0.5">Search: <em>"{col.query}"</em></p>
                )}
              </div>

              {/* Selected image — large preview */}
              {col.selected && (
                <div className="relative mb-3 rounded-xl overflow-hidden border-2 border-purple-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={col.selected.thumbnail_url || col.selected.image_url}
                    alt="Selected"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1">
                    <Check size={14} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                    <span className="text-white text-xs font-semibold">Selected</span>
                  </div>
                </div>
              )}

              {/* Thumbnail grid to swap */}
              <p className="text-xs text-gray-400 mb-2 font-medium">Tap to swap:</p>
              <div className="grid grid-cols-3 gap-1.5">
                {col.images.map((img) => {
                  const isActive = col.selected?.image_url === img.image_url
                  return (
                    <div
                      key={img.image_url}
                      onClick={() => col.setSelected(img)}
                      className={cn(
                        'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                        isActive ? 'border-purple-600 ring-1 ring-purple-400' : 'border-transparent hover:border-purple-300'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.thumbnail_url || img.image_url}
                        alt={img.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/200/200' }}
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                          <Check size={12} className="text-purple-700" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && imagesA.length === 0 && idea && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="font-medium mb-3">No images found yet</p>
          <Button onClick={searchImages}>Search Images</Button>
        </div>
      )}

      {/* Approve & proceed */}
      {!loading && selectedA && selectedB && !imagesApproved && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Happy with these images?</p>
            <p className="text-sm text-gray-400">You can swap them above before approving.</p>
          </div>
          <Button onClick={approveAndProceed} disabled={loadingApproval} size="lg">
            {loadingApproval ? 'Saving…' : 'Approve & Continue'}
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {imagesApproved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
          <span className="text-green-800 font-semibold">Images approved!</span>
          <Button variant="success" onClick={() => router.push(`/campaigns/${id}/design`)}>
            Create Story →
          </Button>
        </div>
      )}
    </div>
  )
}
