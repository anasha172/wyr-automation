import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendApprovalEmail } from '@/lib/resend'
import { sendSlackStoryApproval, sendSlackNotification } from '@/lib/slack'
import { randomUUID } from 'crypto'

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const BOT_TOKEN   = process.env.SLACK_BOT_TOKEN
const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Send a Slack DM to a specific user via chat.postMessage */
async function slackDM(slackUserId: string, blocks: any[], fallbackText: string) {
  if (!BOT_TOKEN) return false
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method:  'POST',
    headers: { Authorization: `Bearer ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ channel: slackUserId, blocks, text: fallbackText }),
  })
  const data = await res.json()
  return data.ok === true
}

/** Fallback: post to webhook channel */
async function slackWebhook(blocks: any[], fallbackText: string) {
  if (!WEBHOOK_URL) return false
  await fetch(WEBHOOK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ blocks, text: fallbackText }),
  })
  return true
}

// ─── POST /api/send-approval ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const {
      campaignId,
      type,               // 'ideas' | 'images' | 'stories'
      managerId,          // app user id of the selected manager
      managerEmail,       // fallback email
      specificIdeaIds,    // idea-level send (ideas page)
      specificIdeaId,
    } = await req.json()

    const supabase = createServiceClient()

    // ── Fetch campaign ────────────────────────────────────────────
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('theme')
      .eq('id', campaignId)
      .single()

    const theme = campaign?.theme ?? 'Campaign'

    // ── Fetch manager info (slack_user_id + email) ────────────────
    let managerSlackId: string | null = null
    let resolvedEmail:  string        = managerEmail ?? ''

    if (managerId) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('slack_user_id')
        .eq('user_id', managerId)
        .single()
      managerSlackId = settings?.slack_user_id ?? null

      if (!resolvedEmail) {
        const { data: { user } } = await supabase.auth.admin.getUserById(managerId)
        resolvedEmail = user?.email ?? ''
      }
    }

    // ── Approval URL ──────────────────────────────────────────────
    let approvalUrl = `${APP_URL}/campaigns/${campaignId}/design`

    if (type !== 'stories') {
      const token    = randomUUID()
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      const { error: tokenError } = await supabase.from('approval_tokens').insert({
        campaign_id:   campaignId,
        token,
        approval_type: type,
        expires_at:    expiresAt,
        used:          false,
      })
      if (!tokenError) approvalUrl = `${APP_URL}/approval/${token}`
    }

    // ════════════════════════════════════════════════════════════════
    // IDEAS — per-idea Slack blocks with Approve/Reject buttons
    // ════════════════════════════════════════════════════════════════
    const ideaIdsToSend: string[] | null = specificIdeaIds ?? (specificIdeaId ? [specificIdeaId] : null)

    if (ideaIdsToSend?.length) {
      const { data: selectedIdeas } = await supabase
        .from('wyr_ideas')
        .select('id, option_a, option_b')
        .in('id', ideaIdsToSend)

      if (!selectedIdeas?.length) throw new Error('Ideas not found')

      // Mark ideas as assigned to this manager
      if (managerId) {
        const { error: assignErr } = await supabase
          .from('wyr_ideas')
          .update({ assigned_manager_id: managerId })
          .in('id', ideaIdsToSend)
        if (assignErr) throw new Error(`Failed to assign manager to ideas: ${assignErr.message}`)
      }

      const isRegen = ideaIdsToSend.length === 1
      const blocks: any[] = [
        {
          type: 'header',
          text: {
            type:  'plain_text',
            text:  isRegen
              ? '🔄 Idea — Approval Needed'
              : `📋 ${selectedIdeas.length} WYR Idea${selectedIdeas.length > 1 ? 's' : ''} — Approval Needed`,
            emoji: true,
          },
        },
        { type: 'section', text: { type: 'mrkdwn', text: `*Campaign:* ${theme}` } },
        { type: 'divider' },
      ]

      selectedIdeas.forEach(idea => {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `*A:* ${idea.option_a}\n*B:* ${idea.option_b}` },
        })
        blocks.push({
          type:     'actions',
          block_id: `idea_${idea.id}`,
          elements: [
            {
              type: 'button', style: 'primary', action_id: 'approve_idea',
              text:  { type: 'plain_text', text: '✅ Approve', emoji: true },
              value: JSON.stringify({ ideaId: idea.id, campaignId, action: 'approved' }),
            },
            {
              type: 'button', style: 'danger', action_id: 'reject_idea',
              text:  { type: 'plain_text', text: '❌ Reject', emoji: true },
              value: JSON.stringify({ ideaId: idea.id, campaignId, action: 'rejected' }),
            },
          ],
        })
        blocks.push({ type: 'divider' })
      })

      const fallback = `${selectedIdeas.length} WYR idea(s) for "${theme}" need approval`

      let sent = false
      if (managerSlackId) sent = await slackDM(managerSlackId, blocks, fallback)
      if (!sent)          sent = await slackWebhook(blocks, fallback)
      if (!sent && resolvedEmail) await sendApprovalEmail(resolvedEmail, theme, 'ideas', approvalUrl)

      return NextResponse.json({ success: true, channel: sent ? 'slack' : 'email' })
    }

    // ════════════════════════════════════════════════════════════════
    // STORIES — all composed stories sent for approval
    // ════════════════════════════════════════════════════════════════
    if (type === 'stories') {
      const { data: ideas } = await supabase
        .from('wyr_ideas')
        .select('id, option_a, option_b, story_image_url')
        .eq('campaign_id', campaignId)
        .eq('approval_status', 'approved')
        .not('story_image_url', 'is', null)

      // Mark stories as assigned to this manager
      if (managerId && ideas?.length) {
        await supabase
          .from('wyr_ideas')
          .update({ story_assigned_manager_id: managerId, story_sent_to_manager: true })
          .in('id', ideas.map((i: any) => i.id))
      }

      const { error: stageErr } = await supabase.from('campaigns').update({ stage: 'stories_pending' }).eq('id', campaignId)
      if (stageErr) throw new Error(`Failed to update campaign stage: ${stageErr.message}`)

      if (ideas?.length) {
        const blocks = await buildStoryBlocks(theme, ideas, campaignId)
        const fallback = `Stories for "${theme}" need your approval`

        let sent = false
        if (managerSlackId) sent = await slackDM(managerSlackId, blocks, fallback)
        if (!sent)          sent = await slackWebhook(blocks, fallback)
        if (!sent && resolvedEmail) await sendApprovalEmail(resolvedEmail, theme, 'stories', approvalUrl)
      }

      return NextResponse.json({ success: true })
    }

    // ════════════════════════════════════════════════════════════════
    // IMAGES (future: if image approval is added)
    // ════════════════════════════════════════════════════════════════
    if (type === 'images') {
      await supabase.from('campaigns').update({ stage: 'images_pending' }).eq('id', campaignId)
      // Mark images as assigned
      if (managerId) {
        await supabase
          .from('wyr_images')
          .update({ assigned_manager_id: managerId, sent_to_manager: true })
          .eq('campaign_id', campaignId)
          .eq('is_manager_pick', true)
      }

      const fallback = `Images for "${theme}" need your approval — ${approvalUrl}`
      let sent = false
      if (managerSlackId) {
        const blocks = [
          { type: 'header', text: { type: 'plain_text', text: '🖼️ Images — Approval Needed', emoji: true } },
          { type: 'section', text: { type: 'mrkdwn', text: `*Campaign:* ${theme}\n<${approvalUrl}|Review images →>` } },
        ]
        sent = await slackDM(managerSlackId, blocks, fallback)
      }
      if (!sent) await slackWebhook([{ type: 'section', text: { type: 'mrkdwn', text: fallback } }], fallback)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── Story blocks builder ─────────────────────────────────────────────────────

async function buildStoryBlocks(theme: string, ideas: any[], campaignId: string) {
  const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const blocks: any[] = [
    { type: 'header', text: { type: 'plain_text', text: '🎨 Stories — Approval Needed', emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', text: `*Campaign:* ${theme}` } },
    { type: 'divider' },
  ]
  ideas.forEach(idea => {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*A:* ${idea.option_a}\n*B:* ${idea.option_b}` },
      ...(idea.story_image_url ? { accessory: { type: 'image', image_url: idea.story_image_url, alt_text: 'Story preview' } } : {}),
    })
    blocks.push({
      type:     'actions',
      block_id: `story_${idea.id}`,
      elements: [
        {
          type: 'button', style: 'primary', action_id: 'approve_story',
          text:  { type: 'plain_text', text: '✅ Approve', emoji: true },
          value: JSON.stringify({ ideaId: idea.id, campaignId }),
        },
        {
          type: 'button', style: 'danger', action_id: 'reject_story',
          text:  { type: 'plain_text', text: '❌ Reject', emoji: true },
          value: JSON.stringify({ ideaId: idea.id, campaignId }),
        },
      ],
    })
    blocks.push({ type: 'divider' })
  })
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `<${APP}/campaigns/${campaignId}/design|View all stories in app →>` },
  })
  return blocks
}
