// Logo proxy — fetches from multiple sources in parallel, returns the largest image found.
// GET /api/linkedin/logo?domain=tiktok.com
//
// Sources tried simultaneously:
//   1. Clearbit        — https://logo.clearbit.com/{domain}?size=128
//   2. icon.horse      — https://icon.horse/icon/{domain}
//   3. Google S2       — https://t3.gstatic.com/faviconV2?...&url=http://{domain}&size=128
//
// Returns the first successful image, or 404 if all fail.

import { NextRequest, NextResponse } from 'next/server'

const TIMEOUT_MS = 6000

async function trySource(url: string): Promise<{ buffer: ArrayBuffer; ct: string; size: number } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 WYR-Studio/1.0' },
      signal:  AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
    })
    const ct = res.headers.get('content-type') ?? ''
    if (!res.ok || !ct.startsWith('image/')) return null
    const buffer = await res.arrayBuffer()
    // Reject tiny images — they're usually generic placeholders (< 800 bytes)
    if (buffer.byteLength < 800) return null
    return { buffer, ct, size: buffer.byteLength }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.trim().toLowerCase()
  if (!domain) {
    return NextResponse.json({ error: 'domain required' }, { status: 400 })
  }

  const sources = [
    `https://logo.clearbit.com/${domain}?size=128`,
    `https://icon.horse/icon/${domain}`,
    `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`,
  ]

  // Race all sources in parallel — pick the first successful result
  const result = await Promise.any(
    sources.map(url =>
      trySource(url).then(r => {
        if (!r) throw new Error('failed')
        return r
      })
    )
  ).catch(() => null)

  if (!result) {
    return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
  }

  return new NextResponse(result.buffer, {
    status:  200,
    headers: {
      'Content-Type':  result.ct,
      'Cache-Control': 'public, max-age=86400',  // 24 h cache
    },
  })
}
