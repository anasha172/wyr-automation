import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

// Short format matching the prototype: "Jun 7" (no year)
export function formatDateShort(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export const STAGES = [
  'ideas_pending',
  'ideas_approved',
  'images_pending',
  'images_approved',
  'stories_pending',
  'stories_approved',
  'design_ready',
  'posted',
] as const

export type Stage = (typeof STAGES)[number]

export const STAGE_LABELS: Record<Stage, string> = {
  ideas_pending:   'Ideas Pending',
  ideas_approved:  'Ideas Approved',
  images_pending:  'Images Pending',
  images_approved: 'Images Ready',
  stories_pending: 'Stories Pending',
  stories_approved:'Stories Approved',
  design_ready:    'Design Ready',
  posted:          'Posted',
}

export const STAGE_COLORS: Record<Stage, string> = {
  ideas_pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  ideas_approved:  'bg-sky-50 text-sky-700 border border-sky-200',
  images_pending:  'bg-blue-50 text-blue-700 border border-blue-200',
  images_approved: 'bg-violet-50 text-violet-700 border border-violet-200',
  stories_pending: 'bg-orange-50 text-orange-700 border border-orange-200',
  stories_approved:'bg-teal-50 text-teal-700 border border-teal-200',
  design_ready:    'bg-purple-50 text-purple-700 border border-purple-200',
  posted:          'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

export const STAGE_DOT: Record<Stage, string> = {
  ideas_pending:   'bg-amber-500',
  ideas_approved:  'bg-sky-500',
  images_pending:  'bg-blue-500',
  images_approved: 'bg-violet-500',
  stories_pending: 'bg-orange-500',
  stories_approved:'bg-teal-500',
  design_ready:    'bg-purple-500',
  posted:          'bg-emerald-500',
}
