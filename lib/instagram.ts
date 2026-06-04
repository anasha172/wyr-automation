const IG_GRAPH_BASE = 'https://graph.facebook.com/v19.0'

export async function postInstagramStory(
  userId: string,
  accessToken: string,
  imageUrl: string
): Promise<{ mediaId: string; postUrl: string }> {
  // Step 1: Create media container
  const containerRes = await fetch(`${IG_GRAPH_BASE}/${userId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      media_type: 'IMAGE',
      is_stories: true,
      access_token: accessToken,
    }),
  })

  if (!containerRes.ok) {
    const err = await containerRes.text()
    throw new Error(`Instagram media container error: ${err}`)
  }

  const { id: creationId } = await containerRes.json()

  // Wait for media to process
  await new Promise((r) => setTimeout(r, 5000))

  // Step 2: Publish
  const publishRes = await fetch(`${IG_GRAPH_BASE}/${userId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken,
    }),
  })

  if (!publishRes.ok) {
    const err = await publishRes.text()
    throw new Error(`Instagram publish error: ${err}`)
  }

  const { id: mediaId } = await publishRes.json()

  return {
    mediaId,
    postUrl: `https://www.instagram.com/p/${mediaId}/`,
  }
}
