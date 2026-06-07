import { NextRequest, NextResponse } from 'next/server'
import { generateWYRIdeas, regenerateSingleIdea } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase-server'

const isDemoMode = process.env.DEMO_MODE === 'true'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, theme, tone, audience, regenerate, ideaId } = await req.json()

    if (regenerate) {
      const idea = await regenerateSingleIdea(theme, tone ?? 'fun', audience ?? 'general')

      // If regenerating a specific idea, save it back to DB as draft
      if (ideaId && !isDemoMode) {
        const supabase = createServiceClient()
        const update: any = {
          option_a: idea.option_a,
          option_b: idea.option_b,
          approval_status: 'pending',
        }
        // Try to save title/why_it_works if columns exist, else use manager_comment
        const { error } = await supabase.from('wyr_ideas').update({
          ...update,
          title: idea.title ?? null,
          why_it_works: idea.why_it_works ?? null,
        }).eq('id', ideaId)

        if (error && (error.message.includes('title') || error.message.includes('why_it_works'))) {
          await supabase.from('wyr_ideas').update({
            ...update,
            manager_comment: JSON.stringify({ _title: idea.title ?? '', _why: idea.why_it_works ?? '' }),
          }).eq('id', ideaId)
        }
      }
      return NextResponse.json({ idea })
    }

    const ideas = await generateWYRIdeas(theme, tone ?? 'fun', audience ?? 'general')

    if (!isDemoMode) {
      const supabase = createServiceClient()

      // Delete existing ideas and start fresh
      await supabase.from('wyr_ideas').delete().eq('campaign_id', campaignId)

      // Try inserting with new fields — status starts as 'draft' (not yet sent to manager)
      const fullRows = ideas.map((idea) => ({
        campaign_id: campaignId,
        title: idea.title ?? null,
        option_a: idea.option_a,
        option_b: idea.option_b,
        why_it_works: idea.why_it_works ?? null,
        approval_status: 'pending',
      }))

      let { data, error } = await supabase.from('wyr_ideas').insert(fullRows).select()

      // Fallback if title/why_it_works columns don't exist yet
      if (error && (error.message.includes('title') || error.message.includes('why_it_works'))) {
        const baseRows = ideas.map((idea) => ({
          campaign_id: campaignId,
          option_a: idea.option_a,
          option_b: idea.option_b,
          approval_status: 'pending',
          manager_comment: JSON.stringify({ _title: idea.title ?? '', _why: idea.why_it_works ?? '' }),
        }))
        const fallback = await supabase.from('wyr_ideas').insert(baseRows).select()
        if (fallback.error) throw fallback.error
        data = (fallback.data ?? []).map((row: any, i: number) => ({
          ...row,
          title: ideas[i]?.title ?? null,
          why_it_works: ideas[i]?.why_it_works ?? null,
        }))
      } else if (error) {
        throw error
      }

      // Enrich with AI fields
      const enriched = (data ?? []).map((row: any, i: number) => ({
        ...row,
        title: row.title ?? ideas[i]?.title ?? null,
        why_it_works: row.why_it_works ?? ideas[i]?.why_it_works ?? null,
      }))

      return NextResponse.json({ ideas: enriched })
    }

    return NextResponse.json({ ideas })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
