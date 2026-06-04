import type { ImageResult } from './google-search'

export async function searchPinterestImages(
  query: string,
  apiToken: string,
  count = 12
): Promise<ImageResult[]> {
  const res = await fetch(
    `https://api.pinterest.com/v5/pins?query=${encodeURIComponent(query)}&page_size=${count}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!res.ok) throw new Error(`Pinterest API error: ${res.status}`)

  const data = await res.json()
  const items = data.items ?? []

  return items.map((pin: any) => ({
    image_url: pin.media?.images?.['1200x']?.url ?? pin.media?.images?.originals?.url ?? '',
    thumbnail_url: pin.media?.images?.['400x300']?.url ?? '',
    title: pin.title ?? pin.description ?? '',
    source_page: `https://pinterest.com/pin/${pin.id}`,
  }))
}
