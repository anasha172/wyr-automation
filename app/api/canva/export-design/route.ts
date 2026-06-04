import { NextRequest, NextResponse } from 'next/server'
import { exportCanvaDesign } from '@/lib/canva'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, designId } = await req.json()

    const supabase = createServiceClient()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('user_id')
      .eq('id', campaignId)
      .single()

    const { data: settings } = await supabase
      .from('user_settings')
      .select('canva_access_token')
      .eq('user_id', campaign?.user_id)
      .single()

    const accessToken = settings?.canva_access_token
    if (!accessToken) throw new Error('Canva not connected')

    const exportedUrl = await exportCanvaDesign(accessToken, designId)

    // Download the image and store in Supabase Storage
    const imageRes = await fetch(exportedUrl)
    const buffer = await imageRes.arrayBuffer()

    const fileName = `designs/${campaignId}-${Date.now()}.png`
    const { error: uploadError } = await supabase.storage
      .from('wyr-designs')
      .upload(fileName, Buffer.from(buffer), { contentType: 'image/png', upsert: true })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('wyr-designs').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    // Update posts table
    await supabase
      .from('posts')
      .update({ final_image_url: publicUrl })
      .eq('campaign_id', campaignId)

    return NextResponse.json({ publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

