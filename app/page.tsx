'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Clock, CheckCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { CampaignPipeline } from '@/components/campaign-pipeline'
import { formatDate, STAGE_LABELS, STAGE_COLORS, type Stage } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Campaign {
  id: string
  theme: string
  stage: string
  created_at: string
  tone: string
  audience: string
}

type FilterTab = 'all' | 'approval' | 'in_progress' | 'posted'

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    if (isDemoMode) {
      setCampaigns(demoStore.campaigns.getAll())
      setLoading(false)
    } else {
      const supabase = createClient()
      supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setCampaigns(data ?? [])
          setLoading(false)
        })
    }
  }, [])

  const filtered = campaigns.filter((c) => {
    if (filter === 'approval') return c.stage === 'ideas_pending' || c.stage === 'images_pending'
    if (filter === 'in_progress') return ['ideas_approved', 'images_approved', 'design_ready'].includes(c.stage)
    if (filter === 'posted') return c.stage === 'posted'
    return true
  })

  const total = campaigns.length
  const pendingApprovals = campaigns.filter(
    (c) => c.stage === 'ideas_pending' || c.stage === 'images_pending'
  ).length
  const postedThisWeek = campaigns.filter((c) => {
    if (c.stage !== 'posted') return false
    const diff = (Date.now() - new Date(c.created_at).getTime()) / 86400000
    return diff <= 7
  }).length

  const STAGE_NEXT: Record<string, string> = {
    ideas_pending: 'ideas',
    ideas_approved: 'images',
    images_pending: 'images',
    images_approved: 'design',
    design_ready: 'publish',
    posted: 'publish',
  }

  return (
    <div>
      {isDemoMode && (
        <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2">
          <span className="font-bold">Demo Mode</span> — Data is stored locally in your browser. AI ideas use OpenRouter.
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your WYR Instagram Story campaigns</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <PlusCircle size={16} />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Clock size={20} className="text-purple-600" />} label="Total Campaigns" value={total} />
        <StatCard icon={<Send size={20} className="text-orange-500" />} label="Pending Approvals" value={pendingApprovals} />
        <StatCard icon={<CheckCircle size={20} className="text-green-500" />} label="Posted This Week" value={postedThisWeek} />
      </div>

      <div className="flex gap-2 mb-4">
        {(
          [
            ['all', 'All'],
            ['approval', 'Awaiting Approval'],
            ['in_progress', 'In Progress'],
            ['posted', 'Posted'],
          ] as [FilterTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === key
                ? 'bg-purple-700 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading campaigns…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-gray-400">
            <p className="font-medium">No campaigns yet</p>
            <Link href="/campaigns/new">
              <Button variant="outline" size="sm">
                <PlusCircle size={14} /> Start your first campaign
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Theme</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pipeline</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const nextPage = STAGE_NEXT[c.stage] ?? 'ideas'
                return (
                  <tr key={c.id} className={cn('border-b border-gray-50 last:border-0', i % 2 === 0 ? '' : 'bg-gray-50/30')}>
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.theme}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STAGE_COLORS[c.stage as Stage] ?? 'bg-gray-100 text-gray-600')}>
                        {STAGE_LABELS[c.stage as Stage] ?? c.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <CampaignPipeline stage={c.stage} compact />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/campaigns/${c.id}/${nextPage}`}>
                        <Button variant="outline" size="sm">Continue →</Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className="p-2.5 bg-purple-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}
