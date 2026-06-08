import { NextRequest, NextResponse } from 'next/server'
import { searchUnsplashImages } from '@/lib/unsplash'
import { searchPexelsImages } from '@/lib/pexels'
import { generateImageSearchQueries } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase-server'

const isDemoMode = process.env.DEMO_MODE === 'true'

/** Search Unsplash first; if 0 results, broaden query, then fall back to Pexels.
 *  Returns { results, source } so the DB row reflects the actual provider. */
async function searchWithFallback(query: string, unsplashKey: string) {
  // 1. Try exact query on Unsplash
  const unsplash = await searchUnsplashImages(query, unsplashKey)
  if (unsplash.length > 0) return { results: unsplash, source: 'unsplash' }

  // 2. Broaden to last meaningful word (e.g. "neon green car" → "car")
  const words = query.trim().split(/\s+/)
  const broadQuery = words[words.length - 1]
  if (broadQuery && broadQuery !== query) {
    const broad = await searchUnsplashImages(broadQuery, unsplashKey)
    if (broad.length > 0) return { results: broad, source: 'unsplash' }
  }

  // 3. Fall back to Pexels
  const pexelsKey = process.env.PEXELS_API_KEY ?? ''
  if (pexelsKey) {
    try {
      const pexels = await searchPexelsImages(query, pexelsKey)
      if (pexels.length > 0) return { results: pexels, source: 'pexels' }
    } catch {
      // Pexels not available — continue
    }
  }

  return { results: [], source: 'unsplash' }
}

export async function POST(req: NextRequest) {
  try {
    const { optionA, optionB, theme, campaignId, ideaId } = await req.json()

    // Use Claude to generate contextually relevant search queries
    const { queryA, queryB } = await generateImageSearchQueries(optionA, optionB, theme)

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY ?? ''

    // Search images for both options in parallel — Pexels fallback if Unsplash returns nothing
    const [a, b] = await Promise.all([
      searchWithFallback(queryA, unsplashKey),
      searchWithFallback(queryB, unsplashKey),
    ])
    const { results: resultsA, source: sourceA } = a
    const { results: resultsB, source: sourceB } = b

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
          source: sourceA,
          approval_status: 'pending',
          is_manager_pick: false,
        })),
        ...resultsB.map((img) => ({
          campaign_id: campaignId,
          idea_id: ideaId,
          option: 'b',
          image_url: img.image_url,
          thumbnail_url: img.thumbnail_url,
          source: sourceB,
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
