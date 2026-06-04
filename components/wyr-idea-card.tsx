'use client'

import { useState } from 'react'
import { RefreshCw, Check, X } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface WyrIdea {
  id: string
  option_a: string
  option_b: string
  approval_status: 'pending' | 'approved' | 'rejected'
  manager_comment?: string
}

interface WyrIdeaCardProps {
  idea: WyrIdea
  index: number
  onUpdate: (id: string, option_a: string, option_b: string) => void
  onRegenerate: (id: string) => void
  loading?: boolean
}

export function WyrIdeaCard({ idea, index, onUpdate, onRegenerate, loading }: WyrIdeaCardProps) {
  const [optionA, setOptionA] = useState(idea.option_a)
  const [optionB, setOptionB] = useState(idea.option_b)

  const statusColor = {
    pending: 'border-gray-200',
    approved: 'border-green-400 bg-green-50',
    rejected: 'border-red-300 bg-red-50',
  }[idea.approval_status]

  const statusBadge = {
    pending: null,
    approved: <span className="text-xs font-semibold text-green-700 flex items-center gap-1"><Check size={12} /> Approved</span>,
    rejected: <span className="text-xs font-semibold text-red-700 flex items-center gap-1"><X size={12} /> Rejected</span>,
  }[idea.approval_status]

  return (
    <div className={cn('border-2 rounded-xl p-4 transition-colors', statusColor)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Idea {index + 1}</span>
        <div className="flex items-center gap-2">
          {statusBadge}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRegenerate(idea.id)}
            disabled={loading}
            title="Regenerate this idea"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-purple-600 font-semibold mb-1 block">Option A</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows={2}
            value={optionA}
            onChange={(e) => {
              setOptionA(e.target.value)
              onUpdate(idea.id, e.target.value, optionB)
            }}
          />
        </div>
        <div className="flex-shrink-0 text-lg font-black text-purple-300">VS</div>
        <div className="flex-1">
          <label className="text-xs text-purple-600 font-semibold mb-1 block">Option B</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows={2}
            value={optionB}
            onChange={(e) => {
              setOptionB(e.target.value)
              onUpdate(idea.id, optionA, e.target.value)
            }}
          />
        </div>
      </div>

      {idea.manager_comment && (
        <p className="mt-2 text-xs text-gray-500 italic">
          Manager note: {idea.manager_comment}
        </p>
      )}
    </div>
  )
}
