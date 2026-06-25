// GET /api/linkedin/fetch-jobs
// Reads the connected Google Sheet and returns up to 5 rows where Status = "Not Posted".
//
// Required env vars:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   — service-account email (or use OAuth token below)
//   GOOGLE_SERVICE_ACCOUNT_KEY     — base64-encoded private key PEM
//   GOOGLE_SHEET_ID                — the spreadsheet ID from the URL
//   GOOGLE_SHEET_TAB               — tab/sheet name, e.g. "Jobs"
//
// Expected column order (A→K):
//   A: Company  B: Title  C: Description  D: Location  E: Job Type
//   F: Country  G: City  H: Link  I: Requirement 1  J: Requirement 2  K: Status

import { NextResponse } from 'next/server'
import type { JobRow }  from '@/lib/linkedin-types'

// ─── Google Sheets helper (lightweight, no SDK required) ─────────────────────

async function getAccessToken(): Promise<string> {
  // We use a service account JWT to get a short-lived access token.
  const email   = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const keyB64  = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!
  const keyPem  = Buffer.from(keyB64, 'base64').toString('utf-8')

  const now = Math.floor(Date.now() / 1000)
  const header  = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss:   email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  }

  const enc   = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${enc(header)}.${enc(payload)}`

  // Sign with RS256 via Web Crypto
  const keyData = keyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryKey = Buffer.from(keyData, 'base64')
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    Buffer.from(unsigned)
  )
  const jwt = `${unsigned}.${Buffer.from(sig).toString('base64url')}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })
  const tokenData = await tokenRes.json()
  return tokenData.access_token as string
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  // ── Demo / missing credentials: return mock data ──────────────────────────
  const sheetId = process.env.GOOGLE_SHEET_ID
  const tab     = process.env.GOOGLE_SHEET_TAB ?? 'Jobs'

  if (!sheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    // Return mock rows so the UI works before credentials are configured
    const mock: JobRow[] = [
      { rowIndex: 2, company: 'TikTok',      title: 'Growth Operations Intern',             description: 'Drive strategy and product operations', location: 'onsite',  jobType: 'internship',  country: 'United Arab Emirates', city: 'Dubai', jobUrl: 'https://linkedin.com/jobs/view/1', requirement1: 'data analysis',    requirement2: "Bachelor's degree or higher", status: 'Not Posted' },
      { rowIndex: 3, company: 'Halliburton', title: 'Civil/Electrical Engineering Intern',  description: 'Support engineering projects on site',   location: 'onsite',  jobType: 'internship',  country: 'United Arab Emirates', city: 'Dubai', jobUrl: 'https://linkedin.com/jobs/view/2', requirement1: 'Engineering degree', requirement2: 'GPA 3.0+',            status: 'Not Posted' },
      { rowIndex: 4, company: 'Amazon',      title: 'Operations & Logistics Intern',        description: 'Optimise fulfilment centre processes',   location: 'onsite',  jobType: 'internship',  country: 'United Arab Emirates', city: 'Dubai', jobUrl: 'https://linkedin.com/jobs/view/3', requirement1: 'Supply chain',      requirement2: 'Excel proficiency',    status: 'Not Posted' },
      { rowIndex: 5, company: 'Salesforce',  title: 'Business Development Associate',       description: 'Grow enterprise accounts across MENA',   location: 'hybrid',  jobType: 'Full-time',   country: 'United Arab Emirates', city: 'Dubai', jobUrl: 'https://linkedin.com/jobs/view/4', requirement1: 'CRM experience',    requirement2: 'Arabic a plus',        status: 'Not Posted' },
      { rowIndex: 6, company: 'Deloitte',    title: 'Business Associate',                   description: 'Consulting across financial services',   location: 'hybrid',  jobType: 'Full-time',   country: 'United Arab Emirates', city: 'Dubai', jobUrl: 'https://linkedin.com/jobs/view/5', requirement1: 'Finance degree',    requirement2: 'MBA preferred',        status: 'Not Posted' },
    ]
    return NextResponse.json({ jobs: mock, source: 'mock' })
  }

  try {
    const token    = await getAccessToken()
    const range    = encodeURIComponent(`${tab}!A2:K`)   // skip header row
    const apiUrl   = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`

    const res  = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Sheets API error' }, { status: 502 })
    }

    const rows: string[][] = data.values ?? []

    // Filter rows where column I (index 8) = "Not Posted" and take up to 5
    const jobs: JobRow[] = rows
      .map((row, i) => ({
        rowIndex:     i + 2,            // 1-based, offset by header
        company:      row[0]  ?? '',
        title:        row[1]  ?? '',
        description:  row[2]  ?? '',
        location:     row[3]  ?? '',
        jobType:      row[4]  ?? '',
        country:      row[5]  ?? '',
        city:         row[6]  ?? '',
        jobUrl:       row[7]  ?? '',
        requirement1: row[8]  ?? '',
        requirement2: row[9]  ?? '',
        status:       (row[10] ?? '') as JobRow['status'],
      }))
      .filter(j => j.status === 'Not Posted' && j.company)
      .slice(0, 5)

    return NextResponse.json({ jobs, source: 'sheet' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
