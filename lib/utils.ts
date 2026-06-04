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

export const STAGES = [
  'ideas_pending',
  'ideas_approved',
  'images_pending',
  'images_approved',
  'design_ready',
  'posted',
] as const

export type Stage = (typeof STAGES)[number]

export const STAGE_LABELS: Record<Stage, string> = {
  ideas_pending: 'Ideas Pending',
  ideas_approved: 'Ideas Approved',
  images_pending: 'Images Pending',
  images_approved: 'Images Approved',
  design_ready: 'Design Ready',
  posted: 'Posted',
}

export const STAGE_COLORS: Record<Stage, string> = {
  ideas_pending: 'bg-yellow-100 text-yellow-800',
  ideas_approved: 'bg-blue-100 text-blue-800',
  images_pending: 'bg-orange-100 text-orange-800',
  images_approved: 'bg-indigo-100 text-indigo-800',
  design_ready: 'bg-purple-100 text-purple-800',
  posted: 'bg-green-100 text-green-800',
}
