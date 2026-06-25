// POST /api/linkedin/post
// Body: { imageDataUrls: string[], caption: string, target: 'personal'|'company', scheduledAt?: string }
// Uploads images to LinkedIn and creates a multi-image post (carousel).
//
// Required env vars (set in Settings UI or .env.local):
//   LINKEDIN_ACCESS_TOKEN   — OAuth 2.0 user token
//   LINKEDIN_PERSON_URN     — urn:li:person:XXXX  (personal profile)
//   LINKEDIN_ORG_URN        — urn:li:organization:XXXX  (company page)

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { imageDataUrls, caption, target, jobs } = await req.json() as {
    imageDataUrls: string[]
    caption:       string
    target:        'personal' | 'company'
    scheduledAt?:  string
    jobs?:         unknown[]   // snapshot of JobSlide[] for history
  }

  const token     = process.env.LINKEDIN_ACCESS_TOKEN
  const personUrn = process.env.LINKEDIN_PERSON_URN
  const orgUrn    = process.env.LINKEDIN_ORG_URN

  // ── Resolve the current user for DB save ──────────────────────────────────
  let userId: string | null = null
  try {
    const caller = await createServerSupabaseClient()
    const { data: { user } } = await caller.auth.getUser()
    userId = user?.id ?? null
  } catch {}

  // ── Helper: save post record to DB ────────────────────────────────────────
  async function saveRecord(postUrl: string) {
    if (!userId) return
    try {
      const service = createServiceClient()
      await service.from('linkedin_posts').insert({
        user_id:     userId,
        jobs:        jobs ?? [],
        caption:     caption ?? '',
        post_url:    postUrl,
        target:      target ?? 'personal',
        slide_count: (jobs?.length ?? 0) + 2,  // intro + jobs + outro
      })
    } catch (err) {
      console.error('Failed to save linkedin_post record:', err)
    }
  }

  // ── Demo mode ─────────────────────────────────────────────────────────────
  if (!token) {
    await new Promise(r => setTimeout(r, 1500)) // simulate latency
    const demoUrl = 'https://www.linkedin.com/feed/update/urn:li:share:DEMO'
    await saveRecord(demoUrl)
    return NextResponse.json({
      ok:      true,
      postUrl: demoUrl,
      source:  'mock',
    })
  }

  const authorUrn = target === 'company' && orgUrn ? orgUrn : personUrn
  if (!authorUrn) {
    return NextResponse.json({ error: 'No LinkedIn URN configured' }, { status: 400 })
  }

  try {
    // Step 1: Register + upload each image
    const assetUrns: string[] = []

    for (const dataUrl of imageDataUrls) {
      // Register upload
      const regRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            owner:                  authorUrn,
            recipes:                ['urn:li:digitalmediaRecipe:feedshare-image'],
            serviceRelationships:   [{ identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' }],
          },
        }),
      })
      const regData = await regRes.json()
      const uploadUrl = regData?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
      const assetUrn  = regData?.value?.asset

      if (!uploadUrl || !assetUrn) {
        return NextResponse.json({ error: 'Failed to register image upload' }, { status: 502 })
      }

      // Upload image bytes
      const base64 = dataUrl.split(',')[1]
      const bytes  = Buffer.from(base64, 'base64')
      await fetch(uploadUrl, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' },
        body:    bytes,
      })

      assetUrns.push(assetUrn)
    }

    // Step 2: Create UGC post with all image assets
    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author:         authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary:  { text: caption },
            shareMediaCategory: 'IMAGE',
            media: assetUrns.map(urn => ({
              status:    'READY',
              media:     urn,
              mediaType: 'IMAGE',
            })),
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    })

    if (!postRes.ok) {
      const err = await postRes.json()
      return NextResponse.json({ error: err?.message ?? 'LinkedIn post failed' }, { status: 502 })
    }

    const postData = await postRes.json()
    const postId   = postData?.id ?? ''
    const postUrl  = `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}`

    await saveRecord(postUrl)

    return NextResponse.json({ ok: true, postUrl })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
