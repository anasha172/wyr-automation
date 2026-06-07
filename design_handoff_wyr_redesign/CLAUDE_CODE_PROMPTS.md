# Claude Code — Copy/Paste Prompt Checklist

Work top to bottom. Paste **one prompt at a time**, let Claude Code finish, run `npm run dev`, compare against the prototype (`reference/WYR Studio.html`), then move to the next. Tick each box as you go.

> Visual target: open `reference/WYR Studio.html` in a browser (sign in with any role).
> Exact values cheat-sheet: `reference/wyr.css`.

---

## ☐ 0 · Orient Claude Code (run once, first)
```
Read design_handoff_wyr_redesign/README.md in full, plus design_handoff_wyr_redesign/reference/wyr.css. This is a visual RE-SKIN of this app to the "Editorial Duel" design. Rules: keep all existing logic, routing, data fetching, Supabase, auth, realtime, demo-mode and role gating EXACTLY as-is — only change styling and presentational markup. Use Tailwind + the existing components/ui and lucide-react. Don't change anything yet — just confirm you understand the plan and list the files you expect to touch.
```

## ☐ 1 · Tokens + fonts
```
Do Step 1 only. Port the colour/radius/shadow tokens from reference/wyr.css :root into app/globals.css (replace the current :root block). Then in app/layout.tsx load Newsreader, Hanken Grotesk and Space Mono via next/font/google, exposing --font-serif, --font-sans, --font-mono, and set --serif/--sans/--mono to use them. Body font = Hanken Grotesk. Remove the old Inter import. Show me the diff, then stop.
```

## ☐ 2 · Shared primitives
```
Build the shared presentational components described in the README's component-mapping table, using Tailwind + the token vars:
- Restyle components/ui/button.tsx variants: ink (primary), a (flame), b (cobalt), go (green), ghost, quiet; sizes sm/lg; lucide icon support.
- New components: StagePill, Pipeline (rework components/campaign-pipeline.tsx), VS, DuelRow, StoryFrame (9:16 with flame/cobalt tints), Avatar.
- Restyle sonner toasts to the ink style.
Match the anatomy/values in reference/wyr.css and reference/wyr-ui.jsx. Don't wire them into pages yet — just build + export them.
```

## ☐ 3 · App shell (sidebar + topbar)
```
Restyle components/sidebar.tsx, components/global-header.tsx and components/app-shell.tsx to match the prototype: 256px paper sidebar with hairline border, serif "WYR" wordmark (flame W / cobalt Y / ink R) + stacked mono WOULD/YOU/RATHER tag, mono section labels, solid-ink active nav item, and the numbered campaign-flow sub-list under an open campaign. Topbar 60px with hairline, breadcrumb left, bell + user menu right. Keep existing nav logic, routes and role gating. Reference: reference/wyr-shell.jsx.
```

## ☐ 4 · Dashboard
```
Restyle app/page.tsx to the prototype: editorial masthead (numbered mono eyebrow → serif title → lede), a 3-up figure row (serif numbers, mono labels, hairline dividers), filter tabs + search, and the campaign table with serif theme + mono meta, channel pill, StagePill, a 5-segment mini-pipeline bar, mono date, "Open ›". Keep all existing data/filtering. Reference: reference/wyr-dashboard.jsx.
```

## ☐ 5 · New Campaign
```
Restyle app/campaigns/new/page.tsx: "Start a duel." masthead, Instagram/LinkedIn channel cards, serif theme textarea + example chips, Tone & Audience as stacked selectable cards, flame "Generate Ideas" CTA. Keep the existing submit/create logic. Reference: reference/wyr-newcampaign.jsx.
```

## ☐ 6 · Ideas (the signature screen)
```
Restyle app/campaigns/[id]/ideas/page.tsx and components/wyr-idea-card.tsx: FlowHeader (eyebrow + StagePill, serif theme + channel pill, Pipeline), approval-progress strip with "Approval link", and five idea DUEL cards — Option A in flame (left), Option B in cobalt (right), serif option text, a centered "vs", select checkbox / status badge / regenerate (or manager approve-reject) in the header. Keep generate/regenerate/edit/send/realtime logic. Reference: reference/wyr-ideas.jsx.
```

## ☐ 7 · Images
```
Restyle app/campaigns/[id]/images/page.tsx: source toggle, idea tabs, a duel banner of the active question, and two columns Option A / Option B each with a large selected preview + 3-col swap grid (selection tinted flame/cobalt), footer progress → "Compose Stories". Keep search/selection/save logic. Reference: reference/wyr-images.jsx.
```

## ☐ 8 · Stories
```
Restyle app/campaigns/[id]/design/page.tsx: grid of story cards, each with source A/B thumbs + a 9:16 StoryFrame preview (flame/cobalt tints) + status; Compose / Compose All / Send to Manager / manager approve-reject; "All approved → Post to Instagram". Keep compose/approval/realtime logic. Reference: reference/wyr-stories.jsx.
```

## ☐ 9 · Publish
```
Restyle app/campaigns/[id]/publish/page.tsx: carousel preview row of StoryFrames, story-approval list, when-to-post (now/schedule), flame "Post as Carousel" CTA, and the success state ("It's posted.", completed pipeline, carousel, View on Instagram, new-campaign CTA). Keep posting logic. Reference: reference/wyr-publish.jsx.
```

## ☐ 10 · Approval (standalone) 
```
Restyle app/approval/[token]/approval-client.tsx: branded header (WYR wordmark, "Approval link", secure-48h pill), centered title with campaign theme, list of duel/story cards with Approve/Reject (+ note on reject), submit → thank-you. No app sidebar/topbar. Keep token validation + submit logic. Reference: reference/wyr-approval.jsx.
```

## ☐ 11 · Manager Overview 
```
Restyle app/manager/page.tsx: "Oversight" masthead, 3 figures, Publishers table (avatars, counts as pills) and an Approval Queue list (serif theme, mono publisher, StagePill, Review ›). Keep the data fetch + access gating. Reference: the Manager component in reference/wyr-admin.jsx.
```

## ☐ 12 · Settings 
```
Restyle app/settings/page.tsx: "Configuration" masthead and stacked settings cards (ink icon tile, title/desc, Connected/Not-set pill, fields), ink "Save all settings". Keep load/save logic. Reference: the Settings component in reference/wyr-admin.jsx.
```

## ☐ 13 · User Management
```
Restyle app/admin/users/page.tsx: "Access" masthead + flame "Add User", users table with role avatars, role chips (flame/cobalt/ink), mono last-active, Edit. Keep existing admin logic. Reference: the AdminUsers component in reference/wyr-admin.jsx.
```

## ☐ 14 · Login
```
Restyle app/login/page.tsx: editorial split — left ink panel (WYR masthead, serif headline, a tilted StoryFrame), right account/role picker cards + email/password form. Keep the real Supabase auth + demo accounts. Reference: the Login component in reference/wyr-dashboard.jsx.
```

## ☐ 15 · Final polish pass
```
Do a final consistency pass across all screens: verify every colour/font/radius comes from the tokens (no leftover indigo/slate/Inter), entrance animations are transform-only (never opacity-based), hover/focus states match, and spacing uses gap not margins. Fix any mismatches against reference/WYR Studio.html.
```

---

### Tips
- If a screen looks off, paste the matching `reference/wyr-*.jsx` snippet and say "match this exactly."
- Commit after each screen (`git commit -m "reskin: dashboard"`) so you can roll back easily.
- The prototype's role-switcher in the topbar is a **demo aid** — don't copy it; keep your real `useUser()` auth.
