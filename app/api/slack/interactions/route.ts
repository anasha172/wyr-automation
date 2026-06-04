import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const payloadRaw = params.get('payload')
    if (!payloadRaw) return NextResponse.json({ error: 'No payload' }, { status: 400 })

    const payload = JSON.parse(payloadRaw)
    const supabase = createServiceClient()

    // Handle button actions
    if (payload.type === 'block_actions') {
      for (const action of payload.actions) {
        const value = JSON.parse(action.value)
        const { ideaId, campaignId, action: status } = value

        // Update idea approval status
        await supabase
          .from('wyr_ideas')
          .update({ approval_status: status })
          .eq('id', ideaId)

        // Advance stage when all ideas have been reviewed (approved OR rejected)
        const { data: ideas } = await supabase
          .from('wyr_ideas')
          .select('approval_status')
          .eq('campaign_id', campaignId)

        const noneStillPending = ideas?.every((i: any) => i.approval_status !== 'pending')
        const approvedCount = ideas?.filter((i: any) => i.approval_status === 'approved').length ?? 0

        if (noneStillPending && approvedCount > 0) {
          await supabase
            .from('campaigns')
            .update({ stage: 'ideas_approved' })
            .eq('id', campaignId)

          // Notify Slack
          await fetch(process.env.SLACK_WEBHOOK_URL!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `✅ *Review complete!* ${approvedCount} idea${approvedCount > 1 ? 's' : ''} approved${ideas!.length - approvedCount > 0 ? `, ${ideas!.length - approvedCount} rejected` : ''}. Campaign is ready for image selection.`,
            }),
          })
        }
      }

      // Acknowledge to Slack immediately (required within 3 seconds)
      return new NextResponse(null, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Slack interaction error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
