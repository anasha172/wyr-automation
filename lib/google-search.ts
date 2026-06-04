export interface ImageResult {
  image_url: string
  thumbnail_url: string
  title: string
  source_page: string
}

export async function searchGoogleImages(
  query: string,
  apiKey: string,
  engineId: string,
  count = 12
): Promise<ImageResult[]> {
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', engineId)
  url.searchParams.set('q', query)
  url.searchParams.set('searchType', 'image')
  url.searchParams.set('num', String(Math.min(count, 10)))
  url.searchParams.set('safe', 'active')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Google Search API error: ${res.status}`)

  const data = await res.json()
  const items = data.items ?? []

  return items.map((item: any) => ({
    image_url: item.link,
    thumbnail_url: item.image?.thumbnailLink ?? item.link,
    title: item.title ?? '',
    source_page: item.image?.contextLink ?? '',
  }))
}
