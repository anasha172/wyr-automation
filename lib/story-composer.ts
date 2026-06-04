import sharp from 'sharp'

const STORY_W = 1080
const STORY_H = 1920
const HALF_H = STORY_H / 2  // 960px each

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function composeStory(
  imageUrlA: string,
  imageUrlB: string
): Promise<Buffer> {
  const [bufA, bufB] = await Promise.all([
    fetchImageBuffer(imageUrlA),
    fetchImageBuffer(imageUrlB),
  ])

  const [imgA, imgB] = await Promise.all([
    sharp(bufA)
      .resize(STORY_W, HALF_H, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 })
      .toBuffer(),
    sharp(bufB)
      .resize(STORY_W, HALF_H, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 })
      .toBuffer(),
  ])

  // Stack Image A (top) + Image B (bottom) — no divider
  const story = await sharp({
    create: {
      width: STORY_W,
      height: STORY_H,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([
      { input: imgA, top: 0, left: 0 },
      { input: imgB, top: HALF_H, left: 0 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()

  return story
}
