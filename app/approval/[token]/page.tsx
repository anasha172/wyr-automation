import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'
import { ApprovalClient } from './approval-client'

interface Props {
  params: Promise<{ token: string }>
}

export default async function ApprovalPage({ params }: Props) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: tokenRow } = await supabase
    .from('approval_tokens')
    .select('*, campaigns(theme)')
    .eq('token', token)
    .single()

  if (!tokenRow) return notFound()

  const isExpired = new Date(tokenRow.expires_at) < new Date()
  if (isExpired || tokenRow.used) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl border p-10 text-center max-w-sm">
          <p className="text-4xl mb-4">⏰</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link Expired</h1>
          <p className="text-gray-500 text-sm">This approval link has expired or already been used.</p>
        </div>
      </div>
    )
  }

  let ideas = []
  let images: { a: any[]; b: any[] } = { a: [], b: [] }

  if (tokenRow.approval_type === 'ideas') {
    const { data } = await supabase
      .from('wyr_ideas')
      .select('*')
      .eq('campaign_id', tokenRow.campaign_id)
    ideas = data ?? []
  } else {
    const { data: imgData } = await supabase
      .from('wyr_images')
      .select('*')
      .eq('campaign_id', tokenRow.campaign_id)
    images.a = imgData?.filter((i: any) => i.option === 'a') ?? []
    images.b = imgData?.filter((i: any) => i.option === 'b') ?? []
  }

  return (
    <ApprovalClient
      token={token}
      tokenRow={tokenRow}
      theme={(tokenRow.campaigns as any)?.theme ?? ''}
      approvalType={tokenRow.approval_type}
      ideas={ideas}
      images={images}
    />
  )
}
