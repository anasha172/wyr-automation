# Handoff: WYR Studio — "Editorial Duel" Redesign

## Overview
A full visual redesign of the **WYR Automation** app (the "Would You Rather" Instagram Story pipeline). It replaces the current indigo/slate SaaS look with a **premium editorial** system built around the product's core idea: the **A vs B duel**. Option A is always a hot **flame** accent, Option B always a cool **cobalt** accent, split down a centre "vs" seam. Big expressive serif headlines, clean grotesque body, monospace metadata, warm paper-white surfaces, hairline rules.

This package documents that design so it can be implemented in the **real `wyr-automation` codebase**.

---

## About the design files
The files in `reference/` are **design references created as HTML/React prototypes** — they show the intended look, layout, and behaviour. **They are not production code to copy verbatim.** Your job is to **recreate these designs inside the existing `wyr-automation` app** using its real stack and patterns:

- **Next.js 14 (App Router)** + **TypeScript**
- **Tailwind CSS v4** (`@import "tailwindcss"` in `app/globals.css`)
- **shadcn/ui** components (`components/ui/*`)
- **lucide-react** icons
- **Supabase** for data, **sonner** for toasts

The prototype uses plain CSS classes + inline React; you will translate those into **Tailwind utilities + the existing component library**. Keep all current functionality, routing, data fetching, auth, and demo-mode behaviour intact — this is a **re-skin**, not a rewrite of logic.

## Fidelity
**High-fidelity.** Colours, typography, spacing, and component anatomy are final. Recreate the UI to match the prototype closely, using Tailwind + shadcn primitives.

---

## 1 · Design tokens

The single source of truth is `reference/wyr.css` (`:root`). Port these into the app. Two good options:

**A) CSS variables (recommended, least churn):** replace the `:root` block in `app/globals.css` with the tokens below, then reference them via Tailwind arbitrary values (`bg-[var(--paper)]`) or by mapping them in `@theme`.

**B) Tailwind v4 `@theme`:** expose them as Tailwind colors so you get `bg-paper`, `text-ink`, `border-hair`, `bg-a`, `bg-b`, etc.

### Colour tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#FBFAF7` | App background (warm off-white) |
| `--paper-2` | `#F4F1EA` | Recessed wells, hover rows, tracks |
| `--card` | `#FFFFFF` | Cards / raised surfaces |
| `--ink` | `#1A1815` | Primary text, primary buttons |
| `--ink-2` | `#57534B` | Secondary text |
| `--ink-3` | `#8E887C` | Muted text, metadata |
| `--hair` | `#E7E2D8` | Hairline borders/rules |
| `--hair-2` | `#D8D2C5` | Stronger borders |
| `--a` (flame) | `oklch(0.605 0.218 30)` ≈ `#E8401A` | **Option A** — primary hot accent |
| `--a-ink` | `oklch(0.46 0.18 30)` | A text on light bg |
| `--a-soft` | `oklch(0.955 0.035 45)` | A tint background |
| `--a-line` | `oklch(0.86 0.09 40)` | A border |
| `--b` (cobalt) | `oklch(0.55 0.195 262)` ≈ `#2347E6` | **Option B** — primary cool accent |
| `--b-ink` | `oklch(0.45 0.17 262)` | B text on light bg |
| `--b-soft` | `oklch(0.955 0.03 265)` | B tint background |
| `--b-line` | `oklch(0.85 0.07 265)` | B border |
| `--pending` | `oklch(0.74 0.13 72)` (mustard) | Pending/awaiting status |
| `--pending-soft` | `oklch(0.955 0.045 78)` | Pending tint |
| `--go` | `oklch(0.55 0.12 158)` (green) | Approved / posted |
| `--go-ink` | `oklch(0.42 0.11 158)` | Approved text |
| `--go-soft` | `oklch(0.95 0.04 158)` | Success tint |

**The duel rule:** anything binary (A/B options, approve/reject, the two image columns) uses flame for the A/positive-left side and cobalt for the B/right side. Accents share chroma+lightness and differ only in hue, so neither dominates.

### Radius / shadow / spacing
- Radii: **8px** controls, **10–12px** wells/inputs, **14px** cards.
- `--shadow-sm`: `0 1px 2px rgba(26,24,21,.04), 0 1px 1px rgba(26,24,21,.03)`
- `--shadow`: `0 4px 18px -6px rgba(26,24,21,.12), 0 2px 6px -2px rgba(26,24,21,.06)`
- `--shadow-lg`: `0 24px 60px -18px rgba(26,24,21,.28), 0 8px 24px -10px rgba(26,24,21,.12)`
- Page padding `34px 40px`; content max-widths **760 / 1180 / 1320**. Stack siblings with flex/grid `gap`, not margins.

---

## 2 · Typography

Three Google fonts. Load via **`next/font/google`** in `app/layout.tsx` and expose as CSS variables, replacing the current single `Inter`.

```ts
import { Newsreader, Hanken_Grotesk, Space_Mono } from 'next/font/google'

const serif = Newsreader({ subsets: ['latin'], weight: ['400','500','600','700'], style: ['normal','italic'], variable: '--font-serif' })
const sans  = Hanken_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-sans' })
const mono  = Space_Mono({ subsets: ['latin'], weight: ['400','700'], variable: '--font-mono' })
// add `${serif.variable} ${sans.variable} ${mono.variable}` to <body> className
```

Then in CSS: `--serif: var(--font-serif), Georgia, serif;` `--sans: var(--font-sans), system-ui, sans-serif;` `--mono: var(--font-mono), ui-monospace, monospace;` Body uses `--sans`.

| Role | Font | Size / weight | Notes |
|---|---|---|---|
| Masthead (page title) | Newsreader | 46px / 500 | `letter-spacing: -0.025em`, line-height ~1.0 |
| Flow title (campaign theme) | Newsreader | 38px / 500 | one line — `white-space: nowrap` |
| Section heading | Newsreader | 26px / 500 | |
| Option text (WYR copy) | Newsreader | 19px | the actual A/B questions |
| Big stat figures | Newsreader | 44px / 500 | dashboard/manager numbers |
| Body / UI | Hanken Grotesk | 15px / 400–600 | buttons, labels, tables |
| Eyebrow / metadata | Space Mono | 11px / 400, uppercase, `letter-spacing: 0.12–0.16em` | section numbers ("01 — Theme"), dates, counts, status |

**Italic Newsreader** is used for accents (e.g. the "vs" mark, emphasised words). Stats are serif; all metadata/labels/dates/counts are mono.

---

## 3 · Component mapping

Recreate each prototype primitive (`reference/wyr-ui.jsx`) using existing app components where they exist.

| Prototype primitive | Implement as | Notes |
|---|---|---|
| `Btn` (kinds: ink/a/b/go/ghost/quiet; sizes sm/lg) | Extend **`components/ui/button.tsx`** variants | `ink`=primary (bg `--ink`), `a`=flame, `b`=cobalt, `go`=green, `ghost`=outline, `quiet`=text. lucide icon left/right. |
| `Icon` | **lucide-react** | The prototype hand-rolls lucide-equivalent paths; use the real lucide icons (names listed in `wyr-ui.jsx` ICON map map cleanly to lucide). |
| `StagePill` | New `components/stage-pill.tsx` | Mono caps + coloured dot + hairline border. Drive from existing `STAGE_LABELS` in `lib/utils.ts`; add a `kind` (pending/progress/posted) → mustard/cobalt/green. |
| `Pipeline` | Rework **`components/campaign-pipeline.tsx`** | Serif numerals in 30px circles, ink=done, ringed=active, hairline bars. Steps: Theme → Ideas → Images → Stories → Posted (already in that file). |
| `VS` | New tiny component | 46px circle, hairline border, italic serif "vs". |
| `DuelRow` | New `components/duel-row.tsx` | 3-col grid: A side (`--a-soft`) · seam+VS · B side (`--b-soft`, right-aligned). Used on ideas/approval. |
| `StoryFrame` | New `components/story-frame.tsx` | **9:16** frame: top half = Option A image with `--a` multiply tint, bottom = Option B with `--b` tint, "WOULD YOU RATHER" mono header, centre "vs" disc. Replaces the picsum thumbnails on stories/publish. Takes `{ imageA, imageB, optionA, optionB, width }`. |
| `Avatar` | New / extend | Circle, mono initials; bg by role (admin=flame, manager=cobalt, publisher=ink). |
| Toasts | keep **sonner** | Restyle to ink background, mono-free; match `.toast` in prototype. |
| `.card`, `.well`, `.figure`, `.tbl`, `.tabs`, `.chip`, `.input`, `.field-label` | Tailwind utility classes / shadcn | See `wyr.css` for exact values; translate to Tailwind. |

**App shell** (`components/sidebar.tsx`, `components/global-header.tsx`, `components/app-shell.tsx`):
- Sidebar 256px, paper bg, hairline right border. Brand = big serif **WYR** wordmark with flame "W", cobalt "Y", ink "R", plus a stacked mono "WOULD/YOU/RATHER" tag. Nav sections use mono labels with a hairline. Active item = solid ink pill. Campaign flow steps (Ideas/Images/Stories/Publish) appear as a numbered sub-list under the open campaign.
- Topbar 60px, hairline bottom, breadcrumb left (mono-ish), bell + user. (The prototype's role switcher is a demo aid — keep the app's real auth/`useUser`.)

---

## 4 · Screen-by-screen

Each maps to an existing route. Match layout/structure from the prototype; keep existing data + logic.

1. **`/` Dashboard** (`app/page.tsx`) — masthead ("01 — The desk" eyebrow → "Dashboard" → lede). 3-up **figure row** (serif numbers, mono labels, hairline dividers). Filter tabs (All / Awaiting Approval / In Progress / Posted) + search. Campaign **table** (`.tbl`): serif theme + mono meta, channel pill, `StagePill`, a 5-segment mini-pipeline bar, mono date, "Open ›". Ref: `reference/wyr-dashboard.jsx`.
2. **`/campaigns/new`** (`app/campaigns/new/page.tsx`) — "02 — New brief" → "Start a duel." Channel cards (Instagram active / LinkedIn "Soon"). Serif theme textarea + example chips. Tone & Audience as stacked selectable cards. Flame "Generate Ideas" CTA. Ref: `reference/wyr-newcampaign.jsx`.
3. **`/campaigns/[id]/ideas`** — **FlowHeader** (eyebrow+stage pill, serif theme + channel pill, Pipeline). Approval-progress strip (green bar) + "Approval link". Five **idea duel cards**: header (select checkbox / "Idea 0N" / status badge / regenerate or manager approve-reject), then the A-flame vs B-cobalt duel with **editable** option text. Action bar (select all / send). "All approved → Find Images". Ref: `reference/wyr-ideas.jsx`.
4. **`/campaigns/[id]/images`** — source toggle (Google/Pinterest), idea tabs, a duel banner of the active question, two columns **Option A / Option B**: big selected preview + 3-col swap grid, selection tinted flame/cobalt. Footer progress → "Compose Stories". Ref: `reference/wyr-images.jsx`.
5. **`/campaigns/[id]/design`** (Stories) — grid of story cards: source A/B thumbs + **`StoryFrame`** 9:16 preview + status; Compose / Compose All / Send to Manager / manager approve-reject; "All approved → Post to Instagram". Ref: `reference/wyr-stories.jsx`.
6. **`/campaigns/[id]/publish`** — carousel preview row of `StoryFrame`s, story-approval list, when-to-post (now/schedule), flame "Post … as Carousel". **Success state**: "It's posted.", completed pipeline, carousel of stories, View-on-Instagram, new-campaign CTA. Ref: `reference/wyr-publish.jsx`.
7. **`/approval/[token]`** (standalone, no chrome) — branded header (WYR wordmark, "Approval link", secure-48h pill), centred title, list of duel/story cards each with Approve/Reject (+ note on reject), submit → thank-you. Ref: `reference/wyr-approval.jsx`.
8. **`/manager`** — "Oversight" masthead, 3 figures, **Publishers** table (avatars, counts as pills), **Approval Queue** list (serif theme, mono publisher, stage pill, Review ›). Ref: `Manager` in `reference/wyr-admin.jsx`.
9. **`/settings`** — "06 — Configuration", stacked **settings cards** (ink icon tile, title/desc, Connected/Not-set pill, fields). Ink "Save all settings". Ref: `Settings` in `reference/wyr-admin.jsx`.
10. **`/admin/users`** — "Access" masthead + flame "Add User", users table (avatar by role, role chip flame/cobalt/ink, mono last-active, Edit). Ref: `AdminUsers` in `reference/wyr-admin.jsx`.
11. **`/login`** — editorial split: left ink panel (WYR masthead, serif headline, a tilted `StoryFrame`), right account/role picker cards + email/password. Ref: `Login` in `reference/wyr-dashboard.jsx`.

---

## 5 · Interactions & behaviour
- **Entrance motion is transform-only** (`translateY` → 0), never opacity-based — content must never be hidden if an animation is paused (matters for SSR/first paint). See `.fade-in` / `.stagger` in `wyr.css`.
- Hover: rows → `--paper-2`; cards lift slightly (`translateY(-2px)`); buttons darken/brighten.
- Status: pending = mustard dot (pulsing `.live`), approved = green check, rejected = flame x.
- Editable idea text uses `contentEditable` in the prototype; in the app keep the existing edit mechanism (inputs writing to Supabase).
- Keep all existing **realtime/polling**, **toast** messages, **demo-mode** behaviour, and **role gating**.

## 6 · Assets
- **Fonts:** Newsreader, Hanken Grotesk, Space Mono (Google Fonts via `next/font`).
- **Icons:** lucide-react (already a dep).
- **Imagery:** the prototype uses `picsum.photos` seeded placeholders to stand in for Google/Pinterest image-search results and story composites. In the real app these come from the existing image-search + Canva/compose flow — no change needed; just ensure `StoryFrame` renders the real `image_url`s with the flame/cobalt tints.
- No custom illustrations or hand-drawn SVGs. Striped CSS placeholders (`.ph`) for empty image slots.

## 7 · Files in this bundle (`reference/`)
- `wyr.css` — **the token + component source of truth.** Start here.
- `WYR Kit.html` — open in a browser: live, documented design system (colours, type, components, patterns, do/don't, a "new module" recipe).
- `WYR Studio.html` — open in a browser: the full clickable prototype of all 11 screens (sign in with any role).
- `wyr-ui.jsx` — shared primitives (Icon/Btn/StagePill/Pipeline/VS/DuelRow/StoryFrame/Avatar/toasts).
- `wyr-shell.jsx` — sidebar + topbar + layout.
- `wyr-dashboard.jsx` — Login + Dashboard.
- `wyr-newcampaign.jsx`, `wyr-ideas.jsx`, `wyr-images.jsx`, `wyr-stories.jsx`, `wyr-publish.jsx` — the campaign flow.
- `wyr-admin.jsx` — Manager + Settings + User Management.
- `wyr-approval.jsx` — standalone approval page.
- `wyr-flowhead.jsx` — flow header + section header.
- `wyr-data.js` — mock data + the stage machine (`STAGE`, `PIPE_STEPS`, `STAGE_NEXT`) — mirrors `lib/utils.ts` in the real app.

---

## How to use this in Claude Code
1. Open the `wyr-automation` repo in Claude Code (the same project these designs were made for).
2. Drop this whole `design_handoff_wyr_redesign/` folder into the repo root.
3. Prompt Claude Code, e.g.:
   > "Read `design_handoff_wyr_redesign/README.md`. Re-skin this app to match the 'Editorial Duel' design. Start by porting the tokens into `app/globals.css` and loading the three fonts via `next/font` in `app/layout.tsx`. Then build the shared components (StagePill, Pipeline, VS, DuelRow, StoryFrame, restyled Button) and apply them screen by screen, starting with the sidebar/topbar and the Dashboard. Keep all existing logic, data, auth and demo-mode behaviour — this is a re-skin. Open `reference/wyr.css` for exact values and the `.html` files in a browser for the visual target."
4. Work screen by screen; diff against the prototype. Tackle order: tokens & fonts → app shell → Dashboard → New Campaign → Ideas → Images → Stories → Publish → Approval → Manager → Settings → Users → Login.

A developer who wasn't part of this conversation can implement the redesign from this README plus `reference/wyr.css` alone.
