import { NextRequest, NextResponse } from 'next/server'
import { composeStory } from '@/lib/story-composer'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, imageUrlA, imageUrlB } = await req.json()

    if (!imageUrlA || !imageUrlB) {
      throw new Error('Both image URLs are required')
    }

    // Compose the 9:16 story image
    const storyBuffer = await composeStory(imageUrlA, imageUrlB)

    // Upload to Supabase Storage
    const supabase = createServiceClient()
    const fileName = `stories/${campaignId}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('wyr-designs')
      .upload(fileName, storyBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('wyr-designs')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Save to posts table
    await supabase.from('posts').upsert({
      campaign_id: campaignId,
      final_image_url: publicUrl,
      canva_design_id: null,
    })

    // Advance campaign stage to design_ready
    await supabase
      .from('campaigns')
      .update({ stage: 'design_ready' })
      .eq('id', campaignId)

    return NextResponse.json({ publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
