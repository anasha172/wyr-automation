'use client'

import { cn } from '@/lib/utils'

const PIPELINE_STEPS = [
  { key: 'theme', label: 'Theme' },
  { key: 'ideas', label: 'Ideas' },
  { key: 'images', label: 'Images' },
  { key: 'design', label: 'Design' },
  { key: 'posted', label: 'Posted' },
]

const STAGE_TO_STEP: Record<string, number> = {
  ideas_pending: 1,
  ideas_approved: 2,
  images_pending: 2,
  images_approved: 3,
  design_ready: 4,
  posted: 5,
}

interface CampaignPipelineProps {
  stage: string
  compact?: boolean
}

export function CampaignPipeline({ stage, compact = false }: CampaignPipelineProps) {
  const currentStep = STAGE_TO_STEP[stage] ?? 0

  if (compact) {
    const stepIdx = currentStep
    const label = PIPELINE_STEPS[Math.min(stepIdx, PIPELINE_STEPS.length - 1)]?.label
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
        {label}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1">
          <div
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              i < currentStep
                ? 'bg-purple-700 text-white'
                : i === currentStep
                ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-400'
                : 'bg-gray-100 text-gray-400'
            )}
          >
            {step.label}
          </div>
          {i < PIPELINE_STEPS.length - 1 && (
            <span className={cn('text-xs', i < currentStep ? 'text-purple-400' : 'text-gray-300')}>
              →
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
