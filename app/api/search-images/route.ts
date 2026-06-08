import { NextRequest, NextResponse } from 'next/server'
import { searchUnsplashImages } from '@/lib/unsplash'
import { searchPexelsImages } from '@/lib/pexels'
import { generateImageSearchQueries } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase-server'

const isDemoMode = process.env.DEMO_MODE === 'true'

/** Search Unsplash first; if 0 results, broaden query, then fall back to Pexels */
async function searchWithFallback(query: string, unsplashKey: string) {
  // 1. Try exact query on Unsplash
  const unsplash = await searchUnsplashImages(query, unsplashKey)
  if (unsplash.length > 0) return unsplash

  // 2. Broaden to last meaningful word (e.g. "neon green car" → "car")
  const words = query.trim().split(/\s+/)
  const broadQuery = words[words.length - 1]
  if (broadQuery && broadQuery !== query) {
    const broad = await searchUnsplashImages(broadQuery, unsplashKey)
    if (broad.length > 0) return broad
  }

  // 3. Fall back to Pexels
  const pexelsKey = process.env.PEXELS_API_KEY ?? ''
  if (pexelsKey) {
    try {
      const pexels = await searchPexelsImages(query, pexelsKey)
      if (pexels.length > 0) return pexels
    } catch {
      // Pexels not available — continue
    }
  }

  return []
}

export async function POST(req: NextRequest) {
  try {
    const { optionA, optionB, theme, campaignId, ideaId } = await req.json()

    // Use Claude to generate contextually relevant search queries
    const { queryA, queryB } = await generateImageSearchQueries(optionA, optionB, theme)

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY ?? ''

    // Search images for both options in parallel — Google fallback if Unsplash returns nothing
    const [resultsA, resultsB] = await Promise.all([
      searchWithFallback(queryA, unsplashKey),
      searchWithFallback(queryB, unsplashKey),
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
