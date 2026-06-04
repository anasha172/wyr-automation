import { NextRequest, NextResponse } from 'next/server'
import { searchUnsplashImages } from '@/lib/unsplash'
import { generateImageSearchQueries } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase-server'

const isDemoMode = process.env.DEMO_MODE === 'true'

export async function POST(req: NextRequest) {
  try {
    const { optionA, optionB, theme, campaignId, ideaId } = await req.json()

    // Use Claude to generate contextually relevant search queries
    const { queryA, queryB } = await generateImageSearchQueries(optionA, optionB, theme)

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY ?? ''

    // Search images for both options in parallel
    const [resultsA, resultsB] = await Promise.all([
      searchUnsplashImages(queryA, unsplashKey),
      searchUnsplashImages(queryB, unsplashKey),
    ])

    // Save to DB in live mode
    if (!isDemoMode && campaignId && ideaId) {
      const supabase = createServiceClient()
      const rows = [
        ...resultsA.map((img) => ({
          campaign_id: campaignId,
          idea_id: ideaId,
          option: 'a',
          image_url: img.image_url,
          thumbnail_url: img.thumbnail_url,
          source: 'unsplash',
          approval_status: 'pending',
          is_manager_pick: false,
        })),
        ...resultsB.map((img) => ({
          campaign_id: campaignId,
          idea_id: ideaId,
          option: 'b',
          image_url: img.image_url,
          thumbnail_url: img.thumbnail_url,
          source: 'unsplash',
          approval_status: 'pending',
          is_manager_pick: false,
        })),
      ]
      await supabase.from('wyr_images').insert(rows)
    }

    return NextResponse.json({ resultsA, resultsB, queryA, queryB })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
