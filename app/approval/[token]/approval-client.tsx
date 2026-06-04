'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  token: string
  tokenRow: any
  theme: string
  approvalType: 'ideas' | 'images'
  ideas: any[]
  images: { a: any[]; b: any[] }
}

export function ApprovalClient({ token, tokenRow, theme, approvalType, ideas, images }: Props) {
  const [ideaStatuses, setIdeaStatuses] = useState<Record<string, { status: 'approved' | 'rejected'; comment: string }>>({})
  const [selectedImageA, setSelectedImageA] = useState<string | null>(null)
  const [selectedImageB, setSelectedImageB] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submitApproval() {
    setLoading(true)
    try {
      const res = await fetch('/api/submit-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          campaignId: tokenRow.campaign_id,
          approvalType,
          ideaStatuses,
          selectedImageA,
          selectedImageB,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl border p-10 text-center max-w-sm">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Thank you!</h1>
          <p className="text-gray-500 text-sm">Your approval has been submitted successfully.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <span className="text-2xl font-black text-purple-700">WYR</span>
            <span className="text-2xl font-black text-gray-800"> Auto</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Manager Approval</h1>
          <p className="text-gray-500 text-sm mt-1">
            Campaign: <strong>{theme}</strong>
          </p>
        </div>

        {approvalType === 'ideas' ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Review WYR Ideas</h2>
            {ideas.map((idea, i) => {
              const status = ideaStatuses[idea.id]
              return (
                <div key={idea.id} className={cn('bg-white rounded-2xl border-2 p-4', status?.status === 'approved' ? 'border-green-400' : status?.status === 'rejected' ? 'border-red-300' : 'border-gray-100')}>
                  <p className="text-xs font-bold text-gray-400 mb-2">Idea {i + 1}</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 bg-purple-50 rounded-lg p-3 text-sm font-medium text-purple-800">{idea.option_a}</div>
                    <span className="font-black text-gray-300">VS</span>
                    <div className="flex-1 bg-purple-50 rounded-lg p-3 text-sm font-medium text-purple-800">{idea.option_b}</div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Button
                      size="sm"
                      variant={status?.status === 'approved' ? 'success' : 'outline'}
                      onClick={() => setIdeaStatuses((p) => ({ ...p, [idea.id]: { status: 'approved', comment: p[idea.id]?.comment ?? '' } }))}
                    >
                      <Check size={14} /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant={status?.status === 'rejected' ? 'destructive' : 'outline'}
                      onClick={() => setIdeaStatuses((p) => ({ ...p, [idea.id]: { status: 'rejected', comment: p[idea.id]?.comment ?? '' } }))}
                    >
                      <X size={14} /> Reject
                    </Button>
                  </div>
                  {status?.status === 'rejected' && (
                    <Textarea
                      placeholder="Optional: Add a comment"
                      className="text-sm mt-1"
                      rows={2}
                      value={status.comment}
                      onChange={(e) => setIdeaStatuses((p) => ({ ...p, [idea.id]: { ...p[idea.id], comment: e.target.value } }))}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="font-semibold text-gray-800">Select Your Preferred Image</h2>
            {(['a', 'b'] as const).map((opt) => {
              const imgs = images[opt]
              const selected = opt === 'a' ? selectedImageA : selectedImageB
              const setSelected = opt === 'a' ? setSelectedImageA : setSelectedImageB
              return (
                <div key={opt} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <h3 className="font-semibold text-purple-700 mb-3">Option {opt.toUpperCase()}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {imgs.map((img: any) => (
                      <div
                        key={img.id}
                        onClick={() => setSelected(img.image_url)}
                        className={cn(
                          'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2',
                          selected === img.image_url ? 'border-purple-600 ring-2 ring-purple-400' : 'border-transparent hover:border-purple-200'
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.thumbnail_url || img.image_url} alt="" className="w-full h-full object-cover" />
                        {selected === img.image_url && (
                          <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                            <div className="bg-purple-600 rounded-full p-1">
                              <Check size={12} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6">
          <Button
            className="w-full"
            size="lg"
            onClick={submitApproval}
            disabled={loading}
          >
            {loading ? 'Submitting…' : 'Submit Approval'}
          </Button>
        </div>
      </div>
    </div>
  )
}
