import type { ImageResult } from './google-search'

export async function searchUnsplashImages(
  query: string,
  accessKey: string,
  count = 9
): Promise<ImageResult[]> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=squarish`,
    { headers: { Authorization: `Client-ID ${accessKey}` } }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Unsplash API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return (data.results ?? []).map((photo: any) => ({
    image_url: photo.urls.regular,
    thumbnail_url: photo.urls.small,
    title: photo.alt_description ?? photo.description ?? query,
    source_page: photo.links.html,
  }))
}
