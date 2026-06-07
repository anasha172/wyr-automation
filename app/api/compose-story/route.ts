import { NextRequest, NextResponse } from 'next/server'
import { composeStory } from '@/lib/story-composer'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, ideaId, imageUrlA, imageUrlB } = await req.json()

    if (!imageUrlA || !imageUrlB) throw new Error('Both image URLs are required')
    if (!ideaId) throw new Error('ideaId is required')

    const storyBuffer = await composeStory(imageUrlA, imageUrlB)

    const supabase = createServiceClient()
    const fileName = `stories/${campaignId}/${ideaId}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('wyr-designs')
      .upload(fileName, storyBuffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('wyr-designs').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    // Save story URL on the idea row
    await supabase
      .from('wyr_ideas')
      .update({ story_image_url: publicUrl, story_approval_status: 'pending' })
      .eq('id', ideaId)

    return NextResponse.json({ publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
