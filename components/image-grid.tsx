'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageResult {
  image_url: string
  thumbnail_url: string
  title: string
  source_page: string
}

interface ImageGridProps {
  images: ImageResult[]
  selected: string[]
  onToggle: (url: string) => void
  maxSelect?: number
  loading?: boolean
}

export function ImageGrid({ images, selected, onToggle, maxSelect = 10, loading }: ImageGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!images.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <p className="text-sm">No images found. Try a different search.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((img) => {
        const isSelected = selected.includes(img.image_url)
        const isDisabled = !isSelected && selected.length >= maxSelect
        return (
          <div
            key={img.image_url}
            onClick={() => !isDisabled && onToggle(img.image_url)}
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
              isSelected ? 'border-purple-600 ring-2 ring-purple-400' : 'border-transparent',
              isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-purple-300'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumbnail_url || img.image_url}
              alt={img.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/placeholder-image.svg'
              }}
            />
            {isSelected && (
              <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                <div className="bg-purple-600 rounded-full p-1">
                  <Check size={14} className="text-white" />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
