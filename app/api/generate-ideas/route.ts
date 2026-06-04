import { NextRequest, NextResponse } from 'next/server'
import { generateWYRIdeas, regenerateSingleIdea } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase-server'

const isDemoMode = process.env.DEMO_MODE === 'true'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, theme, tone, audience, regenerate } = await req.json()

    if (regenerate) {
      const idea = await regenerateSingleIdea(theme, tone ?? 'fun', audience ?? 'general')
      return NextResponse.json({ idea })
    }

    const ideas = await generateWYRIdeas(theme, tone ?? 'fun', audience ?? 'general')

    if (!isDemoMode) {
      // Persist to Supabase only in live mode
      const supabase = createServiceClient()
      const rows = ideas.map((idea) => ({
        campaign_id: campaignId,
        option_a: idea.option_a,
        option_b: idea.option_b,
        approval_status: 'pending',
      }))
      const { data, error } = await supabase.from('wyr_ideas').insert(rows).select()
      if (error) throw error
      await supabase.from('campaigns').update({ stage: 'ideas_pending' }).eq('id', campaignId)
      return NextResponse.json({ ideas: data })
    }

    // Demo mode: return raw ideas (client handles localStorage)
    return NextResponse.json({ ideas })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
