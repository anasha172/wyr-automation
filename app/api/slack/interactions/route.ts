import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const SLACK_API = 'https://slack.com/api'

async function slackApi(method: string, body: object) {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const payloadRaw = params.get('payload')
    if (!payloadRaw) return NextResponse.json({ error: 'No payload' }, { status: 400 })

    const payload = JSON.parse(payloadRaw)
    const supabase = createServiceClient()
    const WEBHOOK = process.env.SLACK_WEBHOOK_URL!
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyr-automation.vercel.app'

    // ── Modal submission: story rejection with comment ────────────────────────
    if (payload.type === 'view_submission' && payload.view?.callback_id === 'reject_story_modal') {
      const metadata = JSON.parse(payload.view.private_metadata ?? '{}')
      const { ideaId, campaignId } = metadata
      const comment = payload.view.state?.values?.rejection_comment?.comment_input?.value ?? ''

      const { error: rejErr } = await supabase
        .from('wyr_ideas')
        .update({ story_approval_status: 'rejected', story_rejection_comment: comment })
        .eq('id', ideaId)

      if (rejErr) console.error('reject_story_modal: failed to update idea', rejErr)

      // Move campaign back to stories_pending so publisher can recompose
      await supabase.from('campaigns').update({ stage: 'stories_pending' }).eq('id', campaignId)

      await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `❌ *Story rejected.*${comment ? ` Reason: "${comment}"` : ''} Publisher will re-pick images and recompose.\n<${APP_URL}/campaigns/${campaignId}/design|Open in App →>`,
        }),
      })

      return new NextResponse(null, { status: 200 })
    }

    // ── Block actions ─────────────────────────────────────────────────────────
    if (payload.type === 'block_actions') {
      const responseUrl = payload.response_url

      for (const action of payload.actions) {
        // ── Idea approval ──
        if (action.action_id === 'approve_idea' || action.action_id === 'reject_idea') {
          const value = JSON.parse(action.value)
          const { ideaId, campaignId, action: status } = value

          await supabase.from('wyr_ideas').update({ approval_status: status }).eq('id', ideaId)

          // Update Slack message to confirm action
          if (responseUrl) {
            await fetch(responseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                replace_original: false,
                text: status === 'approved' ? '✅ Idea approved.' : '❌ Idea rejected.',
              }),
            })
          }

          if (status === 'approved') {
            const { data: ideas } = await supabase
              .from('wyr_ideas')
              .select('approval_status')
              .eq('campaign_id', campaignId)

            const allApproved = ideas?.every((i: any) => i.approval_status === 'approved')
            if (allApproved) {
              await supabase.from('campaigns').update({ stage: 'ideas_approved' }).eq('id', campaignId)
              await fetch(WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: `🎉 *All ideas approved!* Ready for image selection.\n<${APP_URL}/campaigns/${campaignId}/images|Go to Images →>` }),
              })
            }
          } else {
            await fetch(WEBHOOK, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `❌ *Idea rejected.* Publisher will regenerate and re-send.\n<${APP_URL}/campaigns/${campaignId}/ideas|Open in App →>` }),
            })
          }
        }

        // ── Story approval ──
        if (action.action_id === 'approve_story') {
          const value = JSON.parse(action.value)
          const { ideaId, campaignId } = value

          // 1. Update DB — same lean pattern as ideas
          await supabase.from('wyr_ideas').update({ story_approval_status: 'approved' }).eq('id', ideaId)

          // 2. Confirm in Slack immediately so manager sees it registered
          if (responseUrl) {
            await fetch(responseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ replace_original: false, text: '✅ Story approved.' }),
            })
          }

          // 3. Check if all stories for this campaign are now approved
          const { data: ideas } = await supabase
            .from('wyr_ideas')
            .select('story_approval_status')
            .eq('campaign_id', campaignId)
            .eq('approval_status', 'approved')

          const total = ideas?.length ?? 0
          const approvedCount = ideas?.filter((i: any) => i.story_approval_status === 'approved').length ?? 0

          if (total > 0 && approvedCount === total) {
            await supabase.from('campaigns').update({ stage: 'stories_approved' }).eq('id', campaignId)
            await fetch(WEBHOOK, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `🎉 *All stories approved!* Ready to post.\n<${APP_URL}/campaigns/${campaignId}/publish|Post to Instagram →>` }),
            })
          }
        }

        // ── Story rejection: open modal for comment ──
        if (action.action_id === 'reject_story') {
          const value = JSON.parse(action.value)
          const { ideaId, campaignId } = value
          const triggerId = payload.trigger_id

          if (triggerId) {
            await slackApi('views.open', {
              trigger_id: triggerId,
              view: {
                type: 'modal',
                callback_id: 'reject_story_modal',
                private_metadata: JSON.stringify({ ideaId, campaignId }),
                title: { type: 'plain_text', text: 'Reject Story' },
                submit: { type: 'plain_text', text: 'Submit Rejection' },
                close: { type: 'plain_text', text: 'Cancel' },
                blocks: [
                  {
                    type: 'input',
                    block_id: 'rejection_comment',
                    label: { type: 'plain_text', text: 'Reason for rejection (optional)' },
                    element: {
                      type: 'plain_text_input',
                      action_id: 'comment_input',
                      multiline: true,
                      placeholder: { type: 'plain_text', text: 'e.g. Images don\'t match the tone, try different visuals…' },
                    },
                    optional: true,
                  },
                ],
              },
            })
          } else {
            // Fallback if no trigger_id (e.g. webhook-only setup)
            await supabase
              .from('wyr_ideas')
              .update({ story_approval_status: 'rejected' })
              .eq('id', ideaId)

            await fetch(WEBHOOK, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `❌ *Story rejected.* Publisher will re-pick images.\n<${APP_URL}/campaigns/${campaignId}/design|Open in App →>` }),
            })
          }
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
