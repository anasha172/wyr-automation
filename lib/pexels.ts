export interface ImageResult {
  image_url: string
  thumbnail_url: string
  title: string
  source_page: string
}

export async function searchPexelsImages(
  query: string,
  apiKey: string,
  count = 12
): Promise<ImageResult[]> {
  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', String(Math.min(count, 15)))
  url.searchParams.set('orientation', 'portrait') // good for Instagram stories

  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
  })

  if (!res.ok) throw new Error(`Pexels API error: ${res.status}`)

  const data = await res.json()
  const photos = data.photos ?? []

  return photos.map((photo: any) => ({
    image_url: photo.src.large2x ?? photo.src.large,
    thumbnail_url: photo.src.medium,
    title: photo.alt ?? '',
    source_page: photo.url,
  }))
}
