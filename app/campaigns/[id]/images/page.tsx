'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, RefreshCw, ChevronRight, Upload, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode, type DemoIdea } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { FlowHeader } from '@/components/flow-header'
import { VS } from '@/components/vs'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImageResult {
  image_url:     string
  thumbnail_url: string
  title:         string
  source_page:   string
}

interface IdeaImageState {
  imagesA:   ImageResult[]
  imagesB:   ImageResult[]
  selectedA: ImageResult | null
  selectedB: ImageResult | null
  loading:   boolean
  queryA:    string
  queryB:    string
}

// ─── Demo placeholder images ──────────────────────────────────────────────────

function getDemoImages(seed: string, count = 6): ImageResult[] {
  return Array.from({ length: count }, (_, i) => ({
    image_url:     `https://picsum.photos/seed/${seed}-${i}/600/600`,
    thumbnail_url: `https://picsum.photos/seed/${seed}-${i}/300/300`,
    title:         `Image ${i + 1}`,
    source_page:   'https://picsum.photos',
  }))
}

// ─── Local sub-components ─────────────────────────────────────────────────────

/** Compact "A" / "B" dot badge + mono label */
function OptDot({ side }: { side: 'a' | 'b' }) {
  const bg  = side === 'a' ? 'var(--a)' : 'var(--b)'
  const col = side === 'a' ? 'var(--a-ink)' : 'var(--b-ink)'
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           6,
        fontFamily:    'var(--mono)',
        fontSize:      10.5,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color:         col,
      }}
    >
      <span
        style={{
          width:          18,
          height:         18,
          borderRadius:   '50%',
          background:     bg,
          color:          '#fff',
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       10,
          fontWeight:     700,
          flexShrink:     0,
        }}
      >
        {side.toUpperCase()}
      </span>
      Option {side.toUpperCase()}
    </span>
  )
}

/** A/B chip — active state tinted with flame or cobalt */
function ChipSource({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding:      '6px 14px',
        fontFamily:   'var(--sans)',
        fontSize:     13,
        fontWeight:   500,
        textTransform: 'capitalize',
        borderRadius: 7,
        cursor:       'pointer',
        border:       `1px solid ${active ? 'var(--ink)' : 'var(--hair-2)'}`,
        background:   active ? 'var(--card)' : 'var(--paper-2)',
        boxShadow:    active ? 'var(--shadow-sm)' : 'none',
        color:        active ? 'var(--ink)' : 'var(--ink-2)',
        transition:   'all .14s',
      }}
    >
      {label}
    </button>
  )
}

/** Idea tab pill */
function IdeaTab({
  num, active, done, onClick,
}: { num: number; active: boolean; done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          6,
        padding:      '6px 13px',
        fontFamily:   'var(--sans)',
        fontSize:     13,
        fontWeight:   500,
        borderRadius: 7,
        cursor:       'pointer',
        border: `1px solid ${
          active ? 'var(--ink)' :
          done   ? 'color-mix(in oklab, var(--go) 35%, var(--hair))' :
          'var(--hair-2)'
        }`,
        background: active ? 'var(--ink)' : done ? 'var(--go-soft)' : 'var(--paper-2)',
        color:      active ? 'var(--paper)' : done ? 'var(--go-ink)' : 'var(--ink-2)',
        boxShadow:  active ? 'var(--shadow-sm)' : 'none',
        transition: 'all .14s',
      }}
    >
      {done && !active && <Check size={12} />}
      {`Idea ${String(num).padStart(2, '0')}`}
    </button>
  )
}

/** Large selected-image preview or empty placeholder */
function SelectedPreview({
  url, side,
}: { url: string | undefined; side: 'a' | 'b' }) {
  const accent = side === 'a' ? 'var(--a)' : 'var(--b)'

  if (!url) {
    return (
      <div
        style={{
          aspectRatio:    '1',
          borderRadius:   10,
          border:         '2px dashed var(--hair-2)',
          background:     'var(--paper-2)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   10,
          color:          'var(--ink-3)',
          fontFamily:     'var(--mono)',
          fontSize:       10.5,
          textTransform:  'uppercase',
          letterSpacing:  '0.08em',
        }}
      >
        select below
      </div>
    )
  }

  return (
    <div
      style={{
        aspectRatio:  '1',
        borderRadius: 10,
        overflow:     'hidden',
        position:     'relative',
        border:       `2px solid ${accent}`,
        marginBottom: 10,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Selected"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Tint overlay */}
      <div
        style={{
          position:       'absolute',
          inset:          0,
          background:     accent,
          opacity:        0.15,
          mixBlendMode:   'multiply',
          pointerEvents:  'none',
        }}
      />
      {/* Check badge */}
      <div
        style={{
          position:       'absolute',
          top:            8,
          right:          8,
          width:          24,
          height:         24,
          borderRadius:   '50%',
          background:     accent,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <Check size={13} color="#fff" strokeWidth={2.5} />
      </div>
      {/* Bottom label */}
      <div
        style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
          padding:    '24px 10px 8px',
        }}
      >
        <span
          style={{
            color:         '#fff',
            fontFamily:    'var(--mono)',
            fontSize:      10.5,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Selected
        </span>
      </div>
    </div>
  )
}

/** 3×N swap grid of thumbnail images + upload tile */
function SwapGrid({
  images, selectedUrl, side, onPick, onUpload,
}: {
  images:      ImageResult[]
  selectedUrl: string | undefined
  side:        'a' | 'b'
  onPick:      (img: ImageResult) => void
  onUpload:    (img: ImageResult) => void
}) {
  const accent   = side === 'a' ? 'var(--a)' : 'var(--b)'
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_BYTES     = 10 * 1024 * 1024  // 10 MB
  const MIN_PX        = 500

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    // Type check
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Unsupported format. Please upload a JPG, PNG or WebP image.')
      return
    }

    // File size check
    if (file.size > MAX_BYTES) {
      toast.error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string

      // Dimension check via a temporary Image element
      const img = new window.Image()
      img.onload = () => {
        if (img.width < MIN_PX || img.height < MIN_PX) {
          toast.error(`Image too small (${img.width}×${img.height}px). Minimum is 500×500 px.`)
          return
        }
        onUpload({
          image_url:     dataUrl,
          thumbnail_url: dataUrl,
          title:         file.name,
          source_page:   'upload',
        })
        toast.success('Image uploaded and selected.')
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
      {images.map(img => {
        const isSelected = selectedUrl === img.image_url
        return (
          <div
            key={img.image_url}
            onClick={() => onPick(img)}
            style={{
              position:     'relative',
              aspectRatio:  '1',
              borderRadius: 8,
              overflow:     'hidden',
              cursor:       'pointer',
              border:       `2px solid ${isSelected ? accent : 'transparent'}`,
              transition:   'border-color .14s',
              flexShrink:   0,
            }}
            onMouseEnter={e => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = `color-mix(in oklab, ${accent} 45%, transparent)`
            }}
            onMouseLeave={e => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'transparent'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumbnail_url || img.image_url}
              alt={img.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/200/200' }}
            />
            {isSelected && (
              <>
                <div style={{ position: 'absolute', inset: 0, background: accent, opacity: 0.25, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={11} color="#fff" strokeWidth={2.5} />
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* ── Upload tile — .ph striped pattern from wyr.css ── */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        style={{
          position:        'relative',
          aspectRatio:     '1',
          borderRadius:    8,
          overflow:        'hidden',
          cursor:          'pointer',
          border:          `2px dashed ${dragOver ? accent : 'var(--hair-2)'}`,
          background:      dragOver
            ? `color-mix(in oklab, ${accent} 8%, var(--paper-2))`
            : 'var(--paper-2)',
          backgroundImage: dragOver ? 'none' :
            'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(26,24,21,0.05) 9px, rgba(26,24,21,0.05) 10px)',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             6,
          transition:      'border-color .14s, background .14s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent }}
        onMouseLeave={e => { if (!dragOver) (e.currentTarget as HTMLElement).style.borderColor = 'var(--hair-2)' }}
      >
        <Upload size={18} style={{ color: 'var(--ink-3)' }} />
        <span style={{
          fontFamily:    'var(--mono)',
          fontSize:      9.5,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         'var(--ink-3)',
          textAlign:     'center',
          lineHeight:    1.4,
          padding:       '0 4px',
        }}>
          Upload
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          style={{ display: 'none' }}
          onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* Hint text below the full grid — spans all 3 columns */}
      <div
        style={{
          gridColumn:    '1 / -1',
          fontFamily:    'var(--mono)',
          fontSize:      10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color:         'var(--ink-3)',
          lineHeight:    1.7,
          paddingTop:    4,
        }}
      >
        Upload · JPG, PNG or WebP · max 10 MB · min 500 × 500 px · square preferred
      </div>
    </div>
  )
}

/** Loading skeleton — two columns of placeholder blocks */
function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      {[0, 1].map(c => (
        <div key={c}>
          {/* Label placeholder */}
          <div
            className="animate-pulse"
            style={{ height: 12, width: '50%', borderRadius: 6, background: 'var(--paper-2)', marginBottom: 12 }}
          />
          {/* Large preview placeholder */}
          <div
            className="animate-pulse"
            style={{ aspectRatio: '1', borderRadius: 10, background: 'var(--paper-2)', marginBottom: 10 }}
          />
          {/* 3-col grid placeholders */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
            {[0, 1, 2].map(j => (
              <div
                key={j}
                className="animate-pulse"
                style={{ aspectRatio: '1', borderRadius: 8, background: 'var(--paper-2)' }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImagesPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [campaign,    setCampaign]    = useState<any>(null)
  const [ideas,       setIdeas]       = useState<DemoIdea[]>([])
  const [activeTab,   setActiveTab]   = useState(0)
  const [source] = useState<'unsplash'>('unsplash')
  const [ideaStates,  setIdeaStates]  = useState<Record<string, IdeaImageState>>({})
  const [saving,      setSaving]      = useState(false)
  const [managerMap,  setManagerMap]  = useState<Record<string, string>>({})

  // ── Fetch manager names ──────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) return
    fetch('/api/managers')
      .then(r => r.ok ? r.json() : [])
      .then((mgrs: { id: string; full_name: string }[]) => {
        setManagerMap(Object.fromEntries(mgrs.map(m => [m.id, m.full_name])))
      })
      .catch(() => {})
  }, [])

  // ── Data load — unchanged logic ─────────────────────────────
  const loadData = useCallback(async () => {
    if (isDemoMode) {
      const camp   = demoStore.campaigns.get(id)
      setCampaign(camp)
      const approved = demoStore.ideas.getByCampaign(id).filter(i => i.approval_status === 'approved')
      setIdeas(approved)
      const init: Record<string, IdeaImageState> = {}
      for (const idea of approved) {
        const imgs   = demoStore.images.getByCampaign(id).filter(img => img.idea_id === idea.id)
        const pickedA = imgs.find(img => img.option === 'a' && img.is_manager_pick) ?? null
        const pickedB = imgs.find(img => img.option === 'b' && img.is_manager_pick) ?? null
        init[idea.id] = {
          imagesA: [], imagesB: [],
          selectedA: pickedA ? { image_url: pickedA.image_url, thumbnail_url: pickedA.thumbnail_url, title: '', source_page: '' } : null,
          selectedB: pickedB ? { image_url: pickedB.image_url, thumbnail_url: pickedB.thumbnail_url, title: '', source_page: '' } : null,
          loading: false, queryA: idea.option_a, queryB: idea.option_b,
        }
      }
      setIdeaStates(init)
    } else {
      const supabase = createClient()
      const [{ data: camp }, { data: ideaData }, { data: existingImages }] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('wyr_ideas').select('*').eq('campaign_id', id).eq('approval_status', 'approved'),
        supabase.from('wyr_images').select('*').eq('campaign_id', id),
      ])
      setCampaign(camp)
      const approved = ideaData ?? []
      setIdeas(approved)
      const init: Record<string, IdeaImageState> = {}
      for (const idea of approved) {
        const imgs   = (existingImages ?? []).filter((img: any) => img.idea_id === idea.id)
        const pickedA = imgs.find((img: any) => img.option === 'a' && img.is_manager_pick) ?? null
        const pickedB = imgs.find((img: any) => img.option === 'b' && img.is_manager_pick) ?? null
        init[idea.id] = {
          imagesA: [], imagesB: [],
          selectedA: pickedA ? { image_url: pickedA.image_url, thumbnail_url: pickedA.thumbnail_url, title: '', source_page: '' } : null,
          selectedB: pickedB ? { image_url: pickedB.image_url, thumbnail_url: pickedB.thumbnail_url, title: '', source_page: '' } : null,
          loading: false, queryA: idea.option_a, queryB: idea.option_b,
        }
      }
      setIdeaStates(init)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  // Realtime: keep pipeline/stage pill in FlowHeader current
  useEffect(() => {
    if (isDemoMode) return
    const supabase = createClient()
    const channel = supabase
      .channel('images-campaign-' + id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${id}` },
        payload => { setCampaign((prev: any) => ({ ...prev, ...(payload.new as any) })) }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  function updateIdeaState(ideaId: string, patch: Partial<IdeaImageState>) {
    setIdeaStates(prev => ({ ...prev, [ideaId]: { ...prev[ideaId], ...patch } }))
  }

  // ── Search — unchanged logic ────────────────────────────────
  async function searchForIdea(idea: DemoIdea) {
    updateIdeaState(idea.id, { loading: true })
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 800))
        const demoA = getDemoImages(`${idea.id}-a`)
        const demoB = getDemoImages(`${idea.id}-b`)
        updateIdeaState(idea.id, {
          imagesA: demoA, imagesB: demoB,
          selectedA: ideaStates[idea.id]?.selectedA ?? demoA[0],
          selectedB: ideaStates[idea.id]?.selectedB ?? demoB[0],
          queryA: idea.option_a, queryB: idea.option_b,
          loading: false,
        })
      } else {
        const res  = await fetch('/api/search-images', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            optionA: idea.option_a, optionB: idea.option_b,
            theme: campaign?.theme ?? '', source,
            campaignId: id, ideaId: idea.id,
          }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        updateIdeaState(idea.id, {
          imagesA:   data.resultsA,
          imagesB:   data.resultsB,
          selectedA: ideaStates[idea.id]?.selectedA ?? data.resultsA[0] ?? null,
          selectedB: ideaStates[idea.id]?.selectedB ?? data.resultsB[0] ?? null,
          queryA:    data.queryA,
          queryB:    data.queryB,
          loading:   false,
        })
      }
    } catch (err: any) {
      toast.error(err.message)
      updateIdeaState(idea.id, { loading: false })
    }
  }

  // Auto-search on tab change when no images yet — unchanged logic
  useEffect(() => {
    const idea  = ideas[activeTab]
    if (!idea) return
    const state = ideaStates[idea.id]
    if (state && state.imagesA.length === 0 && !state.loading) searchForIdea(idea)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, ideas])

  // ── Save picks — unchanged logic ────────────────────────────
  async function savePicks() {
    const missing = ideas.filter(idea => {
      const s = ideaStates[idea.id]
      return !s?.selectedA || !s?.selectedB
    })
    if (missing.length > 0) {
      toast.error(`Please select images for: ${missing.map((_, i) => `Idea ${ideas.indexOf(_) + 1}`).join(', ')}`)
      return
    }
    setSaving(true)
    try {
      if (isDemoMode) {
        for (const idea of ideas) {
          const s = ideaStates[idea.id]
          demoStore.images.insertMany([
            { campaign_id: id, idea_id: idea.id, option: 'a', image_url: s.selectedA!.image_url, thumbnail_url: s.selectedA!.thumbnail_url, source, approval_status: 'pending', is_manager_pick: true },
            { campaign_id: id, idea_id: idea.id, option: 'b', image_url: s.selectedB!.image_url, thumbnail_url: s.selectedB!.thumbnail_url, source, approval_status: 'pending', is_manager_pick: true },
          ])
        }
        demoStore.campaigns.update({ stage: 'images_approved' }, id)
        toast.success('Images saved for all ideas!')
        router.push(`/campaigns/${id}/design`)
      } else {
        const supabase = createClient()
        const rows: any[] = []
        for (const idea of ideas) {
          const s = ideaStates[idea.id]
          rows.push(
            { campaign_id: id, idea_id: idea.id, option: 'a', image_url: s.selectedA!.image_url, thumbnail_url: s.selectedA!.thumbnail_url, source, approval_status: 'approved', is_manager_pick: true },
            { campaign_id: id, idea_id: idea.id, option: 'b', image_url: s.selectedB!.image_url, thumbnail_url: s.selectedB!.thumbnail_url, source, approval_status: 'approved', is_manager_pick: true },
          )
        }
        const { error: delErr } = await supabase.from('wyr_images').delete().eq('campaign_id', id).eq('is_manager_pick', true)
        if (delErr) throw new Error(delErr.message)
        const { error: insErr } = await supabase.from('wyr_images').insert(rows)
        if (insErr) throw new Error(insErr.message)
        const { error: stageErr } = await supabase.from('campaigns').update({ stage: 'images_approved' }).eq('id', id)
        if (stageErr) throw new Error(`Stage update failed: ${stageErr.message}`)
        toast.success('Images saved for all ideas!')
        router.push(`/campaigns/${id}/design`)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false) }
  }

  // ── Derived state ───────────────────────────────────────────
  const allPicked   = ideas.length > 0 && ideas.every(i => ideaStates[i.id]?.selectedA && ideaStates[i.id]?.selectedB)
  const pickedCount = ideas.filter(i => ideaStates[i.id]?.selectedA && ideaStates[i.id]?.selectedB).length
  const idea        = ideas[activeTab]
  const state       = idea ? ideaStates[idea.id] : null
  const isLoading   = state?.loading ?? false

  // ── Render ──────────────────────────────────────────────────
  return (
    <div>
      {campaign && (
        <FlowHeader theme={campaign.theme} stage={campaign.stage} currentStep="images" tone={campaign.tone} audience={campaign.audience} />
      )}

      <div style={{ padding: '28px 40px 80px', maxWidth: 960, margin: '0 auto' }}>

        {/* ── No approved ideas ────────────────────────────────── */}
        {ideas.length === 0 && (
          <div
            style={{
              padding:      '56px 40px',
              textAlign:    'center',
              background:   'var(--card)',
              border:       '1.5px dashed var(--hair-2)',
              borderRadius: 14,
            }}
          >
            <p style={{ fontWeight: 500, color: 'var(--ink-2)', marginBottom: 6 }}>
              No approved ideas yet.
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>
              Go back and get all ideas approved first.
            </p>
            <Button variant="ghost" onClick={() => router.push(`/campaigns/${id}/ideas`)}>
              ← Back to Ideas
            </Button>
          </div>
        )}

        {ideas.length > 0 && (
          <>
            {/* ── Source toggle + refresh ─────────────────────── */}
            <div
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                marginBottom:   18,
                flexWrap:       'wrap',
                gap:            12,
              }}
            >
              {/* Source label — Unsplash only */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily:    'var(--mono)',
                    fontSize:      10.5,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color:         'var(--ink-3)',
                  }}
                >
                  Source
                </span>
                <ChipSource label="Unsplash" active={true} onClick={() => {}} />
              </div>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => idea && searchForIdea(idea)}
                disabled={isLoading}
              >
                <RefreshCw size={13} style={{ animation: isLoading ? 'spin .7s linear infinite' : 'none' }} />
                {isLoading ? 'Searching…' : 'Refresh'}
              </Button>
            </div>

            {/* ── Idea tabs ───────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {ideas.map((it, i) => {
                const s    = ideaStates[it.id]
                const done = !!(s?.selectedA && s?.selectedB)
                return (
                  <IdeaTab
                    key={it.id}
                    num={i + 1}
                    active={activeTab === i}
                    done={done}
                    onClick={() => setActiveTab(i)}
                  />
                )
              })}
            </div>

            {/* ── Active idea panel ───────────────────────────── */}
            {idea && state && (
              <div
                key={idea.id}
                style={{
                  background:   'var(--card)',
                  border:       '1px solid var(--hair)',
                  borderRadius: 14,
                  padding:      22,
                  marginBottom: 20,
                }}
              >
                {/* Compact duel banner */}
                <div
                  style={{
                    display:             'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    border:              '1px solid var(--hair)',
                    borderRadius:        10,
                    overflow:            'hidden',
                    marginBottom:        22,
                  }}
                >
                  {/* A side */}
                  <div style={{ padding: '12px 16px', background: 'var(--a-soft)' }}>
                    <OptDot side="a" />
                    <div
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize:   16,
                        color:      'var(--ink)',
                        marginTop:  4,
                        lineHeight: 1.4,
                      }}
                    >
                      {idea.option_a}
                    </div>
                  </div>

                  {/* Seam with VS */}
                  <div
                    style={{
                      background: 'var(--hair-2)',
                      position:   'relative',
                      overflow:   'visible',
                      width:      1,
                    }}
                  >
                    <div
                      style={{
                        position:  'absolute',
                        top:       '50%',
                        left:      '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex:    4,
                      }}
                    >
                      <VS size={36} />
                    </div>
                  </div>

                  {/* B side */}
                  <div
                    style={{
                      padding:    '12px 16px',
                      background: 'var(--b-soft)',
                      textAlign:  'right',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <OptDot side="b" />
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize:   16,
                        color:      'var(--ink)',
                        marginTop:  4,
                        lineHeight: 1.4,
                      }}
                    >
                      {idea.option_b}
                    </div>
                  </div>
                </div>

                {/* Loading skeleton */}
                {isLoading && <LoadingSkeleton />}

                {/* Two-column image selectors */}
                {!isLoading && (state.imagesA.length > 0 || state.imagesB.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                    {([
                      {
                        side:   'a' as const,
                        text:   idea.option_a,
                        images: state.imagesA,
                        query:  state.queryA,
                        selected: state.selectedA,
                        pick: (img: ImageResult) => updateIdeaState(idea.id, { selectedA: img }),
                      },
                      {
                        side:   'b' as const,
                        text:   idea.option_b,
                        images: state.imagesB,
                        query:  state.queryB,
                        selected: state.selectedB,
                        pick: (img: ImageResult) => updateIdeaState(idea.id, { selectedB: img }),
                      },
                    ]).map(col => (
                      <div key={col.side}>
                        {/* Search query label */}
                        <div
                          style={{
                            fontFamily:    'var(--mono)',
                            fontSize:      10.5,
                            color:         'var(--ink-3)',
                            marginBottom:  10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            textAlign:     col.side === 'b' ? 'right' : 'left',
                          }}
                        >
                          Search: "{col.query}"
                        </div>

                        {/* Selected preview */}
                        <SelectedPreview
                          url={col.selected?.image_url}
                          side={col.side}
                        />

                        {/* "Tap to swap" label */}
                        <div
                          style={{
                            fontFamily:    'var(--mono)',
                            fontSize:      10,
                            color:         'var(--ink-3)',
                            marginBottom:  7,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          Tap to swap
                        </div>

                        {/* Swap grid */}
                        <SwapGrid
                          images={col.images}
                          selectedUrl={col.selected?.image_url}
                          side={col.side}
                          onPick={col.pick}
                          onUpload={img => {
                            // Prepend the uploaded image to the list and auto-select it
                            const key = col.side === 'a' ? 'imagesA' : 'imagesB'
                            const sel = col.side === 'a' ? 'selectedA' : 'selectedB'
                            updateIdeaState(idea.id, {
                              [key]: [img, ...col.images],
                              [sel]: img,
                            })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state — no search results */}
                {!isLoading && state.imagesA.length === 0 && state.imagesB.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-3)' }}>
                    <p style={{ fontSize: 14, marginBottom: 14 }}>No images loaded yet</p>
                    <Button variant="ink" size="sm" onClick={() => searchForIdea(idea)}>
                      Search Images
                    </Button>
                  </div>
                )}

                {/* Next idea nudge */}
                {state.selectedA && state.selectedB && activeTab < ideas.length - 1 && (
                  <div
                    style={{
                      display:        'flex',
                      justifyContent: 'flex-end',
                      marginTop:      18,
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab(activeTab + 1)}
                    >
                      Next idea
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Footer progress card ─────────────────────────── */}
            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                gap:            16,
                padding:        '16px 22px',
                background:     'var(--card)',
                border:         '1px solid var(--hair)',
                borderRadius:   14,
              }}
            >
              <div>
                {/* Serif progress number */}
                <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)' }}>
                  {pickedCount}
                  <span style={{ color: 'var(--ink-3)' }}> / {ideas.length} ideas have images</span>
                </div>
                {!allPicked && (
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
                    Pick one image per option to continue.
                  </div>
                )}
              </div>

              {!['images_approved','stories_pending','stories_approved','design_ready','posted'].includes(campaign?.stage ?? '') ? (
                <Button
                  variant={allPicked ? 'go' : 'ghost'}
                  size="lg"
                  onClick={savePicks}
                  disabled={!allPicked || saving}
                >
                  {saving ? 'Saving…' : 'Compose Stories'}
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <span
                  style={{
                    display:    'inline-flex',
                    alignItems: 'center',
                    gap:        6,
                    fontFamily: 'var(--mono)',
                    fontSize:   11,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color:      'var(--go-ink)',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={14} />
                  Images confirmed
                  {(() => {
                    const mgrId = (ideas[0] as any)?.assigned_manager_id
                    const name  = mgrId ? managerMap[mgrId] : null
                    return name
                      ? <span style={{ fontWeight: 400, opacity: 0.8, textTransform: 'none', letterSpacing: 0 }}> · {name}</span>
                      : null
                  })()}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
