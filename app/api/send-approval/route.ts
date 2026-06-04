import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendApprovalEmail } from '@/lib/resend'
import { sendSlackApproval, sendSlackNotification } from '@/lib/slack'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, type, managerEmail, specificIdeaId } = await req.json()

    const supabase = createServiceClient()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('theme')
      .eq('id', campaignId)
      .single()

    // If specificIdeaId — only send that one idea to Slack (re-approval after regeneration)
    if (specificIdeaId) {
      const { data: idea } = await supabase
        .from('wyr_ideas')
        .select('id, option_a, option_b')
        .eq('id', specificIdeaId)
        .single()

      if (!idea) throw new Error('Idea not found')

      const slackWebhook = process.env.SLACK_WEBHOOK_URL!
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: '🔄 Regenerated Idea — Re-approval Needed', emoji: true },
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Campaign:* ${campaign?.theme}\nThe publisher has regenerated a rejected idea. Please review:` },
            },
            { type: 'divider' },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*A:* ${idea.option_a}\n*B:* ${idea.option_b}` },
            },
            {
              type: 'actions',
              block_id: `idea_${idea.id}`,
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: '✅ Approve', emoji: true },
                  style: 'primary',
                  action_id: 'approve_idea',
                  value: JSON.stringify({ ideaId: idea.id, campaignId, action: 'approved' }),
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: '❌ Reject', emoji: true },
                  style: 'danger',
                  action_id: 'reject_idea',
                  value: JSON.stringify({ ideaId: idea.id, campaignId, action: 'rejected' }),
                },
              ],
            },
          ],
          text: `Regenerated idea for "${campaign?.theme}" needs approval`,
        }),
      })

      return NextResponse.json({ success: true, channel: 'slack' })
    }

    // Send all ideas to Slack
    const { data: ideas } = await supabase
      .from('wyr_ideas')
      .select('id, option_a, option_b')
      .eq('campaign_id', campaignId)

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    await supabase.from('approval_tokens').insert({
      campaign_id: campaignId,
      token,
      approval_type: type,
      expires_at: expiresAt,
      used: false,
    })

    const newStage = type === 'ideas' ? 'ideas_pending' : 'images_pending'
    await supabase.from('campaigns').update({ stage: newStage }).eq('id', campaignId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const approvalUrl = `${appUrl}/approval/${token}`

    const slackWebhook = process.env.SLACK_WEBHOOK_URL
    const slackToken = process.env.SLACK_BOT_TOKEN

    if (slackWebhook && slackToken && type === 'ideas' && ideas?.length) {
      await sendSlackApproval(slackWebhook, slackToken, campaign?.theme ?? '', type, ideas, approvalUrl, campaignId)
    } else if (slackWebhook) {
      await sendSlackNotification(slackWebhook, `🖼️ *WYR Image Approval needed* for "${campaign?.theme}"\n<${approvalUrl}|Click here to review and approve images>`)
    } else if (managerEmail) {
      await sendApprovalEmail(managerEmail, campaign?.theme ?? '', type, approvalUrl)
    }

    return NextResponse.json({ success: true, token, channel: slackWebhook ? 'slack' : 'email' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
