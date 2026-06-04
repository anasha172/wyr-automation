import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { regenerateSingleIdea } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const payloadRaw = params.get('payload')
    if (!payloadRaw) return NextResponse.json({ error: 'No payload' }, { status: 400 })

    const payload = JSON.parse(payloadRaw)
    const supabase = createServiceClient()
    const WEBHOOK = process.env.SLACK_WEBHOOK_URL!

    if (payload.type === 'block_actions') {
      for (const action of payload.actions) {
        const value = JSON.parse(action.value)
        const { ideaId, campaignId, action: status } = value

        if (status === 'approved') {
          // Mark idea as approved
          await supabase
            .from('wyr_ideas')
            .update({ approval_status: 'approved' })
            .eq('id', ideaId)

          // Check if ALL 5 ideas are now approved
          const { data: ideas } = await supabase
            .from('wyr_ideas')
            .select('approval_status')
            .eq('campaign_id', campaignId)

          const allApproved = ideas?.every((i: any) => i.approval_status === 'approved')

          if (allApproved) {
            await supabase
              .from('campaigns')
              .update({ stage: 'ideas_approved' })
              .eq('id', campaignId)

            await fetch(WEBHOOK, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `🎉 *All ${ideas!.length} ideas approved!* Campaign is ready for image selection.`,
              }),
            })
          }
        } else if (status === 'rejected') {
          // Get campaign info for regeneration
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('theme, tone, audience')
            .eq('id', campaignId)
            .single()

          // Notify Slack that regeneration is happening
          await fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🔄 Idea rejected — regenerating a new one for theme: *${campaign?.theme}*...`,
            }),
          })

          // Regenerate the idea using Claude
          const newIdea = await regenerateSingleIdea(
            campaign?.theme ?? '',
            campaign?.tone ?? 'fun',
            campaign?.audience ?? 'general'
          )

          // Update the idea in DB and reset to pending
          await supabase
            .from('wyr_ideas')
            .update({
              option_a: newIdea.option_a,
              option_b: newIdea.option_b,
              approval_status: 'pending',
            })
            .eq('id', ideaId)

          // Send regenerated idea back to Slack for re-approval
          await fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `✨ *New idea generated for review:*\n*A:* ${newIdea.option_a}\n*B:* ${newIdea.option_b}`,
                  },
                },
                {
                  type: 'actions',
                  block_id: `idea_${ideaId}`,
                  elements: [
                    {
                      type: 'button',
                      text: { type: 'plain_text', text: '✅ Approve', emoji: true },
                      style: 'primary',
                      action_id: 'approve_idea',
                      value: JSON.stringify({ ideaId, campaignId, action: 'approved' }),
                    },
                    {
                      type: 'button',
                      text: { type: 'plain_text', text: '❌ Reject', emoji: true },
                      style: 'danger',
                      action_id: 'reject_idea',
                      value: JSON.stringify({ ideaId, campaignId, action: 'rejected' }),
                    },
                  ],
                },
              ],
              text: 'New idea ready for approval',
            }),
          })
        }
      }

      return new NextResponse(null, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Slack interaction error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
