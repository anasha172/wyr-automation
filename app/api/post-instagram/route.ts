import { NextRequest, NextResponse } from 'next/server'
import { postInstagramStory } from '@/lib/instagram'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, imageUrl, scheduleTime } = await req.json()

    const supabase = createServiceClient()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('user_id')
      .eq('id', campaignId)
      .single()

    const { data: settings } = await supabase
      .from('user_settings')
      .select('instagram_user_id, instagram_access_token')
      .eq('user_id', campaign?.user_id)
      .single()

    const userId = settings?.instagram_user_id ?? process.env.INSTAGRAM_USER_ID
    const accessToken = settings?.instagram_access_token ?? process.env.INSTAGRAM_USER_ACCESS_TOKEN

    if (!userId || !accessToken) throw new Error('Instagram not connected. Go to Settings.')

    const { mediaId, postUrl } = await postInstagramStory(userId, accessToken, imageUrl)

    const now = new Date().toISOString()
    await supabase.from('posts').upsert({
      campaign_id: campaignId,
      final_image_url: imageUrl,
      instagram_media_id: mediaId,
      instagram_post_url: postUrl,
      posted_at: now,
      scheduled_for: scheduleTime ?? null,
    })

    await supabase.from('campaigns').update({ stage: 'posted' }).eq('id', campaignId)

    return NextResponse.json({ instagramPostUrl: postUrl, mediaId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

