import { NextRequest, NextResponse } from 'next/server'
import { createDesignFromTemplate } from '@/lib/canva'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, templateId, imageA, imageB, textA, textB } = await req.json()

    // Get Canva access token from user settings
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
    if (!accessToken) throw new Error('Canva not connected. Go to Settings.')

    const { designId, editUrl } = await createDesignFromTemplate(
      accessToken,
      templateId,
      imageA,
      imageB,
      textA,
      textB
    )

    // Save design ID to posts table
    await supabase.from('posts').upsert({
      campaign_id: campaignId,
      canva_design_id: designId,
    })

    await supabase
      .from('campaigns')
      .update({ stage: 'design_ready' })
      .eq('id', campaignId)

    return NextResponse.json({ designId, editUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

