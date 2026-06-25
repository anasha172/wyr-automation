// ─── LinkedIn Job Posting Module — shared types ───────────────────────────────

export interface JobRow {
  /** Row index in the Google Sheet (1-based, for status writeback) */
  rowIndex:       number
  company:        string   // A
  title:          string   // B
  description:    string   // C
  location:       string   // D — e.g. "onsite"
  jobType:        string   // E — e.g. "internship", "Full-time"
  country:        string   // F — e.g. "United Arab Emirates"
  city:           string   // G — e.g. "Dubai"
  jobUrl:         string   // H — full job link
  requirement1:   string   // I
  requirement2:   string   // J
  status:         'Not Posted' | 'Posted'  // K
}

/** A job enriched with a resolved logo URL (may be null if fetch failed) */
export interface JobSlide extends JobRow {
  /** Clearbit / uploaded logo URL, or null while loading / on error */
  logoUrl: string | null
  /** Whether the logo is still being fetched */
  logoLoading: boolean
  /** Custom logo URL set by user (overrides Clearbit) */
  customLogoUrl?: string
}

export type LinkedInPostMode = 'now' | 'schedule'
export type LinkedInPostTarget = 'personal' | 'company'

export interface LinkedInPublishPayload {
  jobs:        JobSlide[]
  caption:     string
  postMode:    LinkedInPostMode
  scheduledAt: string | null    // ISO string when mode = 'schedule'
  postTarget:  LinkedInPostTarget
}
