'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { CampaignPipeline } from '@/components/campaign-pipeline'
import { Wand2, ChevronRight, RefreshCw } from 'lucide-react'

export default function DesignPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [campaign, setCampaign] = useState<any>(null)
  const [imageA, setImageA] = useState<string | null>(null)
  const [imageB, setImageB] = useState<string | null>(null)
  const [finalImage, setFinalImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (isDemoMode) {
      const camp = demoStore.campaigns.get(id)
      setCampaign(camp)
      const imgs = demoStore.images.getByCampaign(id)
      setImageA(imgs.find((i) => i.option === 'a' && i.is_manager_pick)?.image_url ?? null)
      setImageB(imgs.find((i) => i.option === 'b' && i.is_manager_pick)?.image_url ?? null)
      const post = demoStore.posts.get(id)
      if (post?.final_image_url) setFinalImage(post.final_image_url)
    } else {
      const supabase = createClient()
      const [{ data: camp }, { data: imgA }, { data: imgB }, { data: post }] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('wyr_images').select('image_url').eq('campaign_id', id).eq('option', 'a').eq('is_manager_pick', true).single(),
        supabase.from('wyr_images').select('image_url').eq('campaign_id', id).eq('option', 'b').eq('is_manager_pick', true).single(),
        supabase.from('posts').select('final_image_url').eq('campaign_id', id).single(),
      ])
      setCampaign(camp)
      setImageA(imgA?.image_url ?? null)
      setImageB(imgB?.image_url ?? null)
      if (post?.final_image_url) setFinalImage(post.final_image_url)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function generateStory() {
    if (!imageA || !imageB) return toast.error('No approved images found. Go back to Images step.')
    setLoading(true)
    try {
      if (isDemoMode) {
        // Demo: use the two images side by side as a simple preview
        await new Promise((r) => setTimeout(r, 800))
        const demoFinal = imageA
        setFinalImage(demoFinal)
        demoStore.posts.upsert({ campaign_id: id, final_image_url: demoFinal })
        demoStore.campaigns.update({ stage: 'design_ready' }, id)
        setCampaign((c: any) => c ? { ...c, stage: 'design_ready' } : c)
        toast.success('Story preview ready!')
        return
      }

      const res = await fetch('/api/compose-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, imageUrlA: imageA, imageUrlB: imageB }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFinalImage(data.publicUrl)
      setCampaign((c: any) => c ? { ...c, stage: 'design_ready' } : c)
      toast.success('Story image created!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {campaign && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
              {campaign.theme}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Story</h1>
        {campaign && <CampaignPipeline stage={campaign.stage} />}
      </div>

      {/* Source images preview */}
      {(imageA || imageB) && !finalImage && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-3">Approved Images</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Option A', url: imageA }, { label: 'Option B', url: imageB }].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-bold text-purple-600 mb-1.5">{item.label}</p>
                {item.url
                  ? <img src={item.url} alt={item.label} className="w-full aspect-square object-cover rounded-xl" />
                  : <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">No image</div>
                }
              </div>
            ))}
          </div>

          <Button className="w-full mt-4" size="lg" onClick={generateStory} disabled={loading || !imageA || !imageB}>
            <Wand2 size={16} />
            {loading ? 'Composing story…' : 'Generate Instagram Story'}
          </Button>
        </div>
      )}

      {/* Final story preview */}
      {finalImage && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-600 mb-3">Story Preview (9:16)</p>

          {/* 9:16 frame */}
          <div className="mx-auto overflow-hidden rounded-2xl shadow-lg border border-gray-200" style={{ width: 270, aspectRatio: '9/16' }}>
            <img src={finalImage} alt="Instagram Story" className="w-full h-full object-cover" />
          </div>

          <div className="flex gap-3 mt-5">
            <Button variant="outline" onClick={() => { setFinalImage(null) }} className="flex-1">
              <RefreshCw size={14} />
              Regenerate
            </Button>
            <Button className="flex-1" size="lg" onClick={() => router.push(`/campaigns/${id}/publish`)}>
              Looks Good →
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* No images state */}
      {!imageA && !imageB && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="font-medium mb-2">No approved images found</p>
          <p className="text-sm mb-4">Go back to the Images step and approve your selections first.</p>
          <Button variant="outline" onClick={() => router.push(`/campaigns/${id}/images`)}>
            ← Back to Images
          </Button>
        </div>
      )}
    </div>
  )
}
