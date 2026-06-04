// localStorage-backed store for demo mode.
// Mirrors the Supabase table structure so pages can swap between them easily.

function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function isClient() {
  return typeof window !== 'undefined'
}

function read<T>(key: string): T[] {
  if (!isClient()) return []
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}

function write<T>(key: string, rows: T[]) {
  if (!isClient()) return
  localStorage.setItem(key, JSON.stringify(rows))
}

// ── Generic helpers ───────────────────────────────────────────────────────────

function getAll<T>(table: string): T[] {
  return read<T>(table)
}

function getWhere<T extends Record<string, any>>(table: string, filters: Partial<T>): T[] {
  return read<T>(table).filter((row) =>
    Object.entries(filters).every(([k, v]) => row[k] === v)
  )
}

function insert<T extends Record<string, any>>(table: string, row: Omit<T, 'id' | 'created_at'>): T {
  const rows = read<T>(table)
  const newRow = { id: randomUUID(), created_at: new Date().toISOString(), ...row } as unknown as T
  write(table, [...rows, newRow])
  return newRow
}

function insertMany<T extends Record<string, any>>(table: string, items: Omit<T, 'id' | 'created_at'>[]): T[] {
  const rows = read<T>(table)
  const newRows = items.map((item) => ({ id: randomUUID(), created_at: new Date().toISOString(), ...item } as unknown as T))
  write(table, [...rows, ...newRows])
  return newRows
}

function update<T extends Record<string, any>>(
  table: string,
  patch: Partial<T>,
  filters: Partial<T>
): T[] {
  const rows = read<T>(table).map((row) => {
    const match = Object.entries(filters).every(([k, v]) => row[k] === v)
    return match ? { ...row, ...patch } : row
  })
  write(table, rows)
  return rows.filter((row) => Object.entries(filters).every(([k, v]) => row[k] === v))
}

function upsert<T extends Record<string, any>>(
  table: string,
  row: T,
  uniqueKey: keyof T
): T {
  const rows = read<T>(table)
  const idx = rows.findIndex((r) => r[uniqueKey] === row[uniqueKey])
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...row }
    write(table, rows)
    return rows[idx]
  }
  return insert<T>(table, row)
}

function remove<T extends Record<string, any>>(table: string, filters: Partial<T>) {
  const rows = read<T>(table).filter(
    (row) => !Object.entries(filters).every(([k, v]) => row[k] === v)
  )
  write(table, rows)
}

// ── Typed API ─────────────────────────────────────────────────────────────────

export interface DemoCampaign {
  id: string
  theme: string
  tone: string
  audience: string
  stage: string
  created_at: string
}

export interface DemoIdea {
  id: string
  campaign_id: string
  option_a: string
  option_b: string
  approval_status: 'pending' | 'approved' | 'rejected'
  manager_comment?: string
  created_at: string
}

export interface DemoImage {
  id: string
  campaign_id: string
  idea_id?: string
  option: 'a' | 'b'
  image_url: string
  thumbnail_url: string
  source: string
  approval_status: string
  is_manager_pick: boolean
  created_at: string
}

export interface DemoPost {
  id: string
  campaign_id: string
  canva_design_id?: string
  final_image_url?: string
  instagram_media_id?: string
  instagram_post_url?: string
  posted_at?: string
  scheduled_for?: string
  created_at: string
}

export const demoStore = {
  campaigns: {
    getAll: () => getAll<DemoCampaign>('demo_campaigns'),
    get: (id: string) => getWhere<DemoCampaign>('demo_campaigns', { id })[0] ?? null,
    insert: (row: Omit<DemoCampaign, 'id' | 'created_at'>) =>
      insert<DemoCampaign>('demo_campaigns', row),
    update: (patch: Partial<DemoCampaign>, id: string) =>
      update<DemoCampaign>('demo_campaigns', patch, { id }),
  },
  ideas: {
    getByCampaign: (campaign_id: string) =>
      getWhere<DemoIdea>('demo_ideas', { campaign_id }),
    insert: (row: Omit<DemoIdea, 'id' | 'created_at'>) =>
      insert<DemoIdea>('demo_ideas', row),
    insertMany: (rows: Omit<DemoIdea, 'id' | 'created_at'>[]) =>
      insertMany<DemoIdea>('demo_ideas', rows),
    update: (patch: Partial<DemoIdea>, id: string) =>
      update<DemoIdea>('demo_ideas', patch, { id }),
  },
  images: {
    getByCampaign: (campaign_id: string) =>
      getWhere<DemoImage>('demo_images', { campaign_id }),
    insert: (row: Omit<DemoImage, 'id' | 'created_at'>) =>
      insert<DemoImage>('demo_images', row),
    insertMany: (rows: Omit<DemoImage, 'id' | 'created_at'>[]) =>
      insertMany<DemoImage>('demo_images', rows),
    update: (patch: Partial<DemoImage>, campaign_id: string, option: string) =>
      update<DemoImage>('demo_images', patch, { campaign_id, option } as any),
    setManagerPick: (campaign_id: string, image_url: string, option: 'a' | 'b') => {
      const rows = read<DemoImage>('demo_images').map((img) => {
        if (img.campaign_id !== campaign_id || img.option !== option) return img
        return { ...img, is_manager_pick: img.image_url === image_url, approval_status: img.image_url === image_url ? 'approved' : 'pending' }
      })
      write('demo_images', rows)
    },
  },
  posts: {
    get: (campaign_id: string) => getWhere<DemoPost>('demo_posts', { campaign_id })[0] ?? null,
    upsert: (row: Partial<DemoPost> & { campaign_id: string }) => {
      const existing = getWhere<DemoPost>('demo_posts', { campaign_id: row.campaign_id })[0]
      if (existing) {
        update<DemoPost>('demo_posts', row, { campaign_id: row.campaign_id })
        return { ...existing, ...row }
      }
      return insert<DemoPost>('demo_posts', { ...row, id: randomUUID() } as any)
    },
  },
  settings: {
    get: () => {
      if (!isClient()) return null
      try { return JSON.parse(localStorage.getItem('demo_settings') ?? 'null') } catch { return null }
    },
    save: (settings: Record<string, string>) => {
      if (!isClient()) return
      localStorage.setItem('demo_settings', JSON.stringify(settings))
    },
  },
}

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
