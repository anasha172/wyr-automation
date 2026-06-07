const SLACK_API = 'https://slack.com/api'

export interface WyrIdea {
  id: string
  title?: string
  option_a: string
  option_b: string
  why_it_works?: string
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
    // Title + WYR options
    const ideaText = [
      idea.title ? `*${i + 1}. ${idea.title}*` : `*Idea ${i + 1}*`,
      '',
      '*Would you rather…*',
      `🅰️  ${idea.option_a}`,
      `🅱️  ${idea.option_b}`,
      idea.why_it_works ? `\n💬 *Why it works:* ${idea.why_it_works}` : '',
    ].filter(Boolean).join('\n')

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: ideaText },
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

// Send story images to Slack for approval — one message per story with image preview
export async function sendSlackStoryApproval(
  webhookUrl: string,
  theme: string,
  ideas: Array<{ id: string; option_a: string; option_b: string; story_image_url?: string | null }>,
  webApprovalUrl: string,
  campaignId: string
) {
  // Header with prominent web link
  const headerRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '📸 WYR Story Approval Request', emoji: true } },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Campaign:* ${theme}\nReview each story below. Use the buttons *or* <${webApprovalUrl}|*open in the app →*> to approve/reject.`,
          },
        },
        { type: 'divider' },
      ],
      text: `WYR Story approval needed for "${theme}" — approve at: ${webApprovalUrl}`,
    }),
  })
  if (!headerRes.ok) throw new Error(`Slack webhook error: ${headerRes.status}`)

  // One message per story
  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i]
    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Story ${i + 1} of ${ideas.length}*\n*A:* ${idea.option_a}\n*B:* ${idea.option_b}`,
        },
      },
    ]

    if (idea.story_image_url) {
      blocks.push({
        type: 'image',
        image_url: idea.story_image_url,
        alt_text: `Story ${i + 1}: ${idea.option_a} vs ${idea.option_b}`,
      })
    }

    blocks.push({
      type: 'actions',
      block_id: `story_${idea.id}`,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '✅ Approve', emoji: true },
          style: 'primary',
          action_id: 'approve_story',
          value: JSON.stringify({ ideaId: idea.id, campaignId }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '❌ Reject', emoji: true },
          style: 'danger',
          action_id: 'reject_story',
          value: JSON.stringify({ ideaId: idea.id, campaignId }),
        },
      ],
    })

    // Web fallback link per story — always works regardless of Slack interactivity setup
    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `Can't use buttons? <${webApprovalUrl}|Approve in the app →>`,
      }],
    })

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks, text: `Story ${i + 1}/${ideas.length} for "${theme}"` }),
    })
  }
}

// Post a simple notification message
export async function sendSlackNotification(webhookUrl: string, text: string) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}
