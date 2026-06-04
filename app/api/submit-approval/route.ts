import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { token, campaignId, approvalType, ideaStatuses, selectedImageA, selectedImageB } =
      await req.json()

    const supabase = createServiceClient()

    if (approvalType === 'ideas') {
      // Update each idea's approval status
      for (const [ideaId, data] of Object.entries(ideaStatuses as Record<string, any>)) {
        await supabase
          .from('wyr_ideas')
          .update({ approval_status: data.status, manager_comment: data.comment ?? null })
          .eq('id', ideaId)
      }

      // Check if all approved â†’ advance stage
      const { data: ideas } = await supabase
        .from('wyr_ideas')
        .select('approval_status')
        .eq('campaign_id', campaignId)

      const allApproved = ideas?.every((i: any) => i.approval_status === 'approved')
      if (allApproved) {
        await supabase.from('campaigns').update({ stage: 'ideas_approved' }).eq('id', campaignId)
      }
    } else {
      // Mark manager picks for images
      if (selectedImageA) {
        await supabase
          .from('wyr_images')
          .update({ is_manager_pick: true, approval_status: 'approved' })
          .eq('campaign_id', campaignId)
          .eq('image_url', selectedImageA)
          .eq('option', 'a')
      }
      if (selectedImageB) {
        await supabase
          .from('wyr_images')
          .update({ is_manager_pick: true, approval_status: 'approved' })
          .eq('campaign_id', campaignId)
          .eq('image_url', selectedImageB)
          .eq('option', 'b')
      }
      await supabase.from('campaigns').update({ stage: 'images_approved' }).eq('id', campaignId)
    }

    // Mark token as used
    await supabase.from('approval_tokens').update({ used: true }).eq('token', token)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

