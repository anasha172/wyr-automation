import { NextRequest, NextResponse } from 'next/server'
import { searchUnsplashImages } from '@/lib/unsplash'
import { searchPexelsImages } from '@/lib/pexels'
import { generateImageSearchQueries } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase-server'

const isDemoMode = process.env.DEMO_MODE === 'true'

const TARGET = 9

/** Search Unsplash first; if fewer than TARGET results, top up from Pexels.
 *  Returns combined results with per-image source tracked via source_page URL. */
async function searchWithFallback(query: string, unsplashKey: string) {
  // 1. Try Unsplash
  let unsplash = await searchUnsplashImages(query, unsplashKey)

  // 2. If Unsplash returned nothing, broaden to last meaningful word
  if (unsplash.length === 0) {
    const words = query.trim().split(/\s+/)
    const broadQuery = words[words.length - 1]
    if (broadQuery && broadQuery !== query) {
      unsplash = await searchUnsplashImages(broadQuery, unsplashKey)
    }
  }

  const combined = [...unsplash]

  // 3. If still under TARGET, top up with Pexels
  const needed = TARGET - combined.length
  if (needed > 0) {
    const pexelsKey = process.env.PEXELS_API_KEY ?? ''
    if (pexelsKey) {
      try {
        const pexels = await searchPexelsImages(query, pexelsKey, needed)
        combined.push(...pexels)
      } catch {
        // Pexels not available — use what we have
      }
    }
  }

  return combined
}

export async function POST(req: NextRequest) {
  try {
    const { optionA, optionB, theme, campaignId, ideaId } = await req.json()

    // Use Claude to generate contextually relevant search queries
    const { queryA, queryB } = await generateImageSearchQueries(optionA, optionB, theme)

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY ?? ''

    // Search images for both options in parallel — Pexels tops up if Unsplash returns < 9
    const [resultsA, resultsB] = await Promise.all([
      searchWithFallback(queryA, unsplashKey),
      searchWithFallback(queryB, unsplashKey),
    ])

    // Save to DB in live mode — derive source from image URL
    if (!isDemoMode && campaignId && ideaId) {
      const supabase = createServiceClient()
      const toRow = (img: any, option: 'a' | 'b') => ({
        campaign_id: campaignId,
        idea_id: ideaId,
        option,
        image_url: img.image_url,
        thumbnail_url: img.thumbnail_url,
        source: img.source_page?.includes('pexels') ? 'pexels' : 'unsplash',
        approval_status: 'pending',
        is_manager_pick: false,
      })
      const rows = [
        ...resultsA.map((img) => toRow(img, 'a')),
        ...resultsB.map((img) => toRow(img, 'b')),
      ]
      await supabase.from('wyr_images').insert(rows)
    }

    return NextResponse.json({ resultsA, resultsB, queryA, queryB })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
