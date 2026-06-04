'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const EXAMPLE_THEMES = ['Travel', 'Food', 'Career', 'Tech', 'Relationships', 'Fitness', 'Money']
const TONES = ['fun', 'thought-provoking', 'controversial'] as const
const AUDIENCES = ['general', 'gen-z', 'professionals'] as const

type Tone = (typeof TONES)[number]
type Audience = (typeof AUDIENCES)[number]

export default function NewCampaignPage() {
  const router = useRouter()
  const [theme, setTheme] = useState('')
  const [tone, setTone] = useState<Tone>('fun')
  const [audience, setAudience] = useState<Audience>('general')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!theme.trim()) return toast.error('Please enter a theme')

    setLoading(true)
    try {
      let id: string

      if (isDemoMode) {
        const campaign = demoStore.campaigns.insert({
          theme: theme.trim(),
          tone,
          audience,
          stage: 'ideas_pending',
        })
        id = campaign.id
      } else {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('campaigns')
          .insert({ theme: theme.trim(), tone, audience, stage: 'ideas_pending' })
          .select()
          .single()
        if (error) throw error
        id = data.id
      }

      router.push(`/campaigns/${id}/ideas`)
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
        <p className="text-gray-500 text-sm mt-1">Start by entering your WYR theme</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What's the theme for this Would You Rather?
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            rows={3}
            placeholder="e.g. Travel adventures, Career choices, Food preferences…"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {EXAMPLE_THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tone</label>
          <div className="flex gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize',
                  tone === t
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
          <div className="flex gap-2">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize',
                  audience === a
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {a === 'gen-z' ? 'Gen Z' : a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Creating…' : 'Generate Ideas →'}
        </Button>
      </form>
    </div>
  )
}
