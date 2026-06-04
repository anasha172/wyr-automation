import { cn } from '@/lib/utils'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

const styles: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize', styles[status])}>
      {status}
    </span>
  )
}
