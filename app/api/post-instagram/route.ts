import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, imageUrls, scheduleTime } = await req.json()

    if (!imageUrls || imageUrls.length === 0) throw new Error('No image URLs provided')

    const supabase = createServiceClient()

    const { data: campaign } = await supabase.from('campaigns').select('user_id').eq('id', campaignId).single()
    const { data: settings } = await supabase
      .from('user_settings')
      .select('instagram_user_id, instagram_access_token')
      .eq('user_id', campaign?.user_id)
      .single()

    const userId = settings?.instagram_user_id ?? process.env.INSTAGRAM_USER_ID
    const accessToken = settings?.instagram_access_token ?? process.env.INSTAGRAM_USER_ACCESS_TOKEN

    if (!userId || !accessToken) throw new Error('Instagram not connected. Go to Settings.')

    const baseUrl = `https://graph.facebook.com/v19.0`

    let mediaId: string
    let postUrl: string

    if (imageUrls.length === 1) {
      // Single image story
      const createRes = await fetch(`${baseUrl}/${userId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrls[0], media_type: 'IMAGE', is_stories: true, access_token: accessToken }),
      })
      const createData = await createRes.json()
      if (createData.error) throw new Error(createData.error.message)

      const publishRes = await fetch(`${baseUrl}/${userId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
      })
      const publishData = await publishRes.json()
      if (publishData.error) throw new Error(publishData.error.message)

      mediaId = publishData.id
      postUrl = `https://www.instagram.com/p/${publishData.id}/`
    } else {
      // Carousel: create a container per child image, then publish album
      const childIds: string[] = []

      for (const url of imageUrls) {
        const childRes = await fetch(`${baseUrl}/${userId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: url, media_type: 'IMAGE', is_carousel_item: true, access_token: accessToken }),
        })
        const childData = await childRes.json()
        if (childData.error) throw new Error(childData.error.message)
        childIds.push(childData.id)
      }

      const carouselRes = await fetch(`${baseUrl}/${userId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: childIds.join(','),
          access_token: accessToken,
        }),
      })
      const carouselData = await carouselRes.json()
      if (carouselData.error) throw new Error(carouselData.error.message)

      const publishRes = await fetch(`${baseUrl}/${userId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: carouselData.id, access_token: accessToken }),
      })
      const publishData = await publishRes.json()
      if (publishData.error) throw new Error(publishData.error.message)

      mediaId = publishData.id
      postUrl = `https://www.instagram.com/p/${publishData.id}/`
    }

    const now = new Date().toISOString()
    await supabase.from('posts').upsert({
      campaign_id: campaignId,
      final_image_url: imageUrls[0],
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
