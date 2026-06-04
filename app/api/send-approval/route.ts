import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendApprovalEmail } from '@/lib/resend'
import { sendSlackApproval, sendSlackNotification } from '@/lib/slack'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, type, managerEmail } = await req.json()

    const supabase = createServiceClient()

    // Get campaign + ideas
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('theme')
      .eq('id', campaignId)
      .single()

    const { data: ideas } = await supabase
      .from('wyr_ideas')
      .select('id, option_a, option_b')
      .eq('campaign_id', campaignId)

    // Create approval token
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('approval_tokens').insert({
      campaign_id: campaignId,
      token,
      approval_type: type,
      expires_at: expiresAt,
      used: false,
    })
    if (error) throw error

    const newStage = type === 'ideas' ? 'ideas_pending' : 'images_pending'
    await supabase.from('campaigns').update({ stage: newStage }).eq('id', campaignId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const approvalUrl = `${appUrl}/approval/${token}`

    // Use Slack if configured, otherwise fall back to email
    const slackWebhook = process.env.SLACK_WEBHOOK_URL
    const slackToken = process.env.SLACK_BOT_TOKEN

    if (slackWebhook && slackToken && type === 'ideas' && ideas?.length) {
      await sendSlackApproval(
        slackWebhook,
        slackToken,
        campaign?.theme ?? '',
        type,
        ideas,
        approvalUrl,
        campaignId
      )
    } else if (slackWebhook) {
      // For image approvals, send a simple Slack notification with web link
      await sendSlackNotification(
        slackWebhook,
        `🖼️ *WYR Image Approval needed* for "${campaign?.theme}"\n<${approvalUrl}|Click here to review and approve images>`
      )
    } else if (managerEmail) {
      // Fall back to email
      await sendApprovalEmail(managerEmail, campaign?.theme ?? '', type, approvalUrl)
    }

    return NextResponse.json({ success: true, token, channel: slackWebhook ? 'slack' : 'email' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
