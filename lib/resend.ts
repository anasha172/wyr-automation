import { Resend } from 'resend'

export async function sendApprovalEmail(
  to: string,
  campaignTheme: string,
  approvalType: 'ideas' | 'images' | 'stories',
  approvalLink: string
) {
  const subject =
    approvalType === 'ideas'
      ? `[WYR App] Approval needed: "${campaignTheme}" ideas`
      : approvalType === 'stories'
      ? `[WYR App] Story approval needed: "${campaignTheme}"`
      : `[WYR App] Approval needed: "${campaignTheme}" images`

  const body =
    approvalType === 'ideas'
      ? `<p>Please review and approve the Would You Rather ideas for the theme: <strong>${campaignTheme}</strong></p>`
      : approvalType === 'stories'
      ? `<p>Please review and approve the composed Instagram Stories for: <strong>${campaignTheme}</strong></p>`
      : `<p>Please select your preferred image for each option in the <strong>${campaignTheme}</strong> campaign</p>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6B21A8;">Would You Rather — Manager Approval</h2>
        ${body}
        <br/>
        <a href="${approvalLink}" style="background:#6B21A8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">
          Review & Approve →
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px;">This link expires in 48 hours.</p>
      </div>
    `,
  })
}
