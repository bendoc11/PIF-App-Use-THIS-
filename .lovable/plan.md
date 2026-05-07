# Get Recruited — Locker Room Redesign

Transform `/recruit` from CRM-feeling layout into a Nike Training Club × ESPN scoreboard recruiting command center for 15–18 year old athletes.

## Scope

This is a **frontend-only visual + language redesign**. No DB changes, no edge function changes, no business logic changes. All existing data flows (SendGrid sending, replies, pipeline tracking) remain wired up exactly as they are — only the presentation changes.

## Language Replacements (global on this page)

| Old | New |
|---|---|
| Compose new outreach | Message a coach |
| Past outreach / Outreach | Sent messages |
| Reply rate | (removed from hero) |
| Pipeline | Your schools |
| In conversation | Interested |
| Official interest | Offer received |
| Recruiting level | Your level |
| Coaches contacted | Coaches messaged |
| Two-way command center | (deleted) |

## Typography & Color

- Add Barlow Condensed (800, 900) + DM Sans (400, 500, 600) to `index.html`
- Add new tokens to `tailwind.config.ts` and `index.css` scoped to the recruit page (so the rest of the dark-themed app is untouched):
  - `--brand-orange #E85C2C`, `--brand-orange-light #FFF0EB`
  - `--brand-black #0D0D0D`, `--brand-cream #F5F2ED`
  - `--brand-ink #1A1A1A`, `--brand-muted #9A9590`, `--brand-border #E8E4DE`
  - Division badge palette (D1/D2/D3/JUCO/NAIA)
- Headings/numbers: `font-['Barlow_Condensed']` weight 900, 48–64px scoreboard sizing
- Body: `font-['DM_Sans']`

The rest of the app keeps its existing dark theme — these new tokens only render via explicit class names on the recruit page.

## Layout

```text
┌──────────┬───────────────────────────────────────┬──────────────┐
│ Sidebar  │  Top bar (greeting · streak · CTA)    │              │
│ (existing│                                       │ Right panel  │
│  app     │  ┌─────────┬─────────┬─────────┐      │ - Next moves │
│  sidebar │  │ SCHOOLS │ COACHES │ OFFERS  │      │ - Weekly goal│
│  stays)  │  │ INTERST.│ MESSAGED│ RECEIVED│      │ - Your schl. │
│          │  └─────────┴─────────┴─────────┘      │ - Got offer? │
│          │  ┌─────────────────────────────┐      │              │
│          │  │ FIND YOUR SCHOOL (USA map)  │      │              │
│          │  │ filter pills, dots, list    │      │              │
│          │  └─────────────────────────────┘      │              │
│          │  Sent messages list (collapsible)     │              │
└──────────┴───────────────────────────────────────┴──────────────┘
```

The existing app `AppSidebar` (dark, navigation) stays — the spec's "PIF sidebar" is essentially what we already have. We do not replace global navigation.

## Components (new / refactored)

All new components live under `src/components/recruit/scoreboard/`:

1. **RecruitTopBar** — greeting with athlete first name in orange, weekly streak pill, "Message a coach" primary orange CTA with 4s pulse.
2. **HeroMetrics** — 3-card row, staggered fade-up:
   - Card 1 (orange): SCHOOLS INTERESTED — count of pipeline-flagged schools, decorative white circle
   - Card 2 (white): COACHES MESSAGED — derived from outreach rows, "X more to hit weekly goal"
   - Card 3 (white): OFFERS RECEIVED — count from `recruiting_offers`
3. **FindYourSchoolMap** — white card containing:
   - Header + division filter pills (D1/D2/D3/JUCO/NAIA toggle)
   - Inline SVG USA map (240px tall, cream background) with dots from `mockSchools` colored by division; contacted = white ring; interested = orange + pulse ring
   - Hover tooltip with school/division/coach count
   - Recently viewed school list (3 rows): name, meta, division badge, "Mark interested", "Message →"
   - Floating "Browse all schools →" button
4. **RightRail** with 4 stacked cards:
   - **NextMoves** — quest-style checklist driven by profile completeness, weekly count, GPA presence
   - **WeeklyGoalDark** — dark card, 10 bar segments, animated fill
   - **YourSchools** — 3 mini stats (Contacted/Interested/Offers) + 2-3 recent schools
   - **GotOfferCTA** — warm tinted, opens existing `AddOfferDialog`
5. **MessageModal** — wraps the existing `EmailComposer` flow but with the new visual chrome (cream fields, Barlow header, success state with checkmark + auto-close). We reuse the existing send pipeline; only the shell changes.

## Files Touched

**New:**
- `src/components/recruit/scoreboard/RecruitTopBar.tsx`
- `src/components/recruit/scoreboard/HeroMetrics.tsx`
- `src/components/recruit/scoreboard/FindYourSchoolMap.tsx`
- `src/components/recruit/scoreboard/UsaMapSvg.tsx` (inline simplified US outline path)
- `src/components/recruit/scoreboard/RightRail.tsx`
- `src/components/recruit/scoreboard/NextMoves.tsx`
- `src/components/recruit/scoreboard/WeeklyGoalDark.tsx`
- `src/components/recruit/scoreboard/YourSchoolsCard.tsx`
- `src/components/recruit/scoreboard/GotOfferCTA.tsx`
- `src/components/recruit/scoreboard/MessageModal.tsx`
- `src/components/recruit/scoreboard/tokens.css` (scoped CSS variables + keyframes)

**Edited:**
- `src/pages/Recruit.tsx` — replace the current main column layout with the new scoreboard layout, keep all existing data hooks (outreach, replies, pipeline, celebration, banner) and route their data into the new components. Wrap the page in a `recruit-scoreboard` class so cream background + new tokens apply only here.
- `index.html` — add Barlow Condensed + DM Sans Google Fonts links.
- `tailwind.config.ts` — add `fontFamily.heading` (Barlow Condensed) and `fontFamily.sans-recruit` (DM Sans) plus the brand color tokens.

**Untouched (preserved):**
- All edge functions (`send-outreach-email`, `sendgrid-inbound`)
- All DB tables / migrations
- Global app theme, navigation, dashboard, drills, courses
- `EmailComposer` send logic — only its visual wrapper changes via `MessageModal`

## Animations

Implemented via existing Tailwind animation utilities + a small keyframe set in `tokens.css`:

- Hero stats: `fade-up` with `animation-delay` 0/80/160ms
- Number pop on increment: `scale(1.2) → 1` 300ms with spring easing (key off React state diff)
- Map dot hover: scale 1.6 + drop-shadow over 150ms
- Mark interested: button orange flash, star fill, pill slide-in (4px → 0, opacity 0 → 1)
- Weekly bars: left-to-right reveal, 50ms stagger
- CTA pulse: 4s box-shadow keyframe loop
- Filter toggle: dot opacity 0.2s
- Modal: scale 0.95→1 + fade, 220ms `cubic-bezier(0.22,1,0.36,1)`

## Verification

- Confirm preview renders cream background, orange hero card, USA map with colored dots
- Confirm "Message a coach" still sends via SendGrid (no change to `EmailComposer` send path)
- Confirm replies, banner, and celebration still appear (we keep mounting `UnreadRepliesBanner` and `FirstReplyCelebration`)
- Confirm `recruiting_offers` "Add" flow still works through `AddOfferDialog`
- No build errors; existing dark app pages unaffected
