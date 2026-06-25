// POST /api/linkedin/update-status
// Body: { rowIndexes: number[] }
// Updates column I ("Status") → "Posted" for each given row in the Google Sheet.

import { NextRequest, NextResponse } from 'next/server'

async function getAccessToken(): Promise<string> {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const keyB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!
  const keyPem = Buffer.from(keyB64, 'base64').toString('utf-8')

  const now = Math.floor(Date.now() / 1000)
  const header  = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss:   email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  }

  const enc      = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const unsigned = `${enc(header)}.${enc(payload)}`

  const keyData  = keyPem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '')
  const binaryKey = Buffer.from(keyData, 'base64')
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const sig  = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, Buffer.from(unsigned))
  const jwt  = `${unsigned}.${Buffer.from(sig).toString('base64url')}`

  const tokenRes  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  return (await tokenRes.json()).access_token as string
}

export async function POST(req: NextRequest) {
  const { rowIndexes } = await req.json() as { rowIndexes: number[] }
  if (!rowIndexes?.length) return NextResponse.json({ ok: true, updated: 0 })

  const sheetId = process.env.GOOGLE_SHEET_ID
  const tab     = process.env.GOOGLE_SHEET_TAB ?? 'Jobs'

  // Demo mode — no credentials
  if (!sheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    return NextResponse.json({ ok: true, updated: rowIndexes.length, source: 'mock' })
  }

  try {
    const token = await getAccessToken()

    // Build a batchUpdate request — one valueRange per row, targeting column I
    const data = rowIndexes.map(row => ({
      range:          `${tab}!I${row}`,
      majorDimension: 'ROWS',
      values:         [['Posted']],
    }))

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ valueInputOption: 'RAW', data }),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message }, { status: 502 })
    }

    return NextResponse.json({ ok: true, updated: rowIndexes.length })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
