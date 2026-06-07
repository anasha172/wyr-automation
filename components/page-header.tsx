'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { InstagramIcon } from '@/components/icons'
import { CampaignPipeline } from '@/components/campaign-pipeline'

interface PageHeaderProps {
  campaignId: string
  theme: string
  tone?: string
  audience?: string
  stage: string
  currentPage: string
}

export function PageHeader({ campaignId, theme, tone, audience, stage, currentPage }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Breadcrumb */}
      <div className="px-8 pt-4 pb-0 flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/" className="hover:text-indigo-600 transition-colors font-medium">Campaigns</Link>
        <ChevronRight size={14} />
        <span className="text-gray-600 font-medium truncate max-w-xs">{theme}</span>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-semibold">{currentPage}</span>
      </div>

      <div className="px-8 pt-3 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-gray-900">{theme}</h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
            <InstagramIcon size={12} className="text-pink-500" />
            Instagram
          </span>
        </div>
        {(tone || audience) && (
          <p className="text-sm text-gray-400 capitalize mb-1">{[tone, audience].filter(Boolean).join(' · ')}</p>
        )}
        <CampaignPipeline stage={stage} />
      </div>
    </div>
  )
}
