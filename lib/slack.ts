const SLACK_API = 'https://slack.com/api'

export interface WyrIdea {
  id: string
  option_a: string
  option_b: string
}

// Send approval request to Slack with interactive Block Kit buttons
export async function sendSlackApproval(
  webhookUrl: string,
  botToken: string,
  theme: string,
  approvalType: 'ideas' | 'images',
  ideas: WyrIdea[],
  webApprovalUrl: string,
  campaignId: string
) {
  const blocks: any[] = [
    // Header
    {
      type: 'header',
      text: { type: 'plain_text', text: `🤔 WYR Approval Request`, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Campaign Theme:* ${theme}\n*Type:* ${approvalType === 'ideas' ? 'Would You Rather Ideas' : 'Image Selection'}\n\nPlease review and approve each idea below:`,
      },
    },
    { type: 'divider' },
  ]

  // One block per idea with Approve/Reject buttons
  ideas.forEach((idea, i) => {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Idea ${i + 1}*\n*A:* ${idea.option_a}\n*B:* ${idea.option_b}`,
      },
    })
    blocks.push({
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
    })
    blocks.push({ type: 'divider' })
  })

  // Footer with web fallback link
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Or <${webApprovalUrl}|approve on the web> · WYR Automation`,
      },
    ],
  })

  // Send via incoming webhook
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks, text: `WYR Approval needed for "${theme}"` }),
  })

  if (!res.ok) throw new Error(`Slack webhook error: ${res.status}`)
}

// Update a single idea button to show its status after manager clicks
export async function updateSlackMessage(
  botToken: string,
  channelId: string,
  ts: string,
  ideaId: string,
  status: 'approved' | 'rejected',
  optionA: string,
  optionB: string,
  ideaIndex: number
) {
  const statusIcon = status === 'approved' ? '✅ Approved' : '❌ Rejected'

  await fetch(`${SLACK_API}/chat.update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: channelId,
      ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Idea ${ideaIndex + 1}* — ${statusIcon}\n*A:* ${optionA}\n*B:* ${optionB}`,
          },
        },
      ],
    }),
  })
}

// Post a simple notification message
export async function sendSlackNotification(webhookUrl: string, text: string) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}
