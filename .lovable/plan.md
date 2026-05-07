# Recruiting Command Center Redesign

Transforms Get Recruited from a one-way outreach tool into a two-way communication hub now that SendGrid replies land in the app.

## What changes (user-visible)

1. **Live activity hero** at top of `/recruit`: 4 metric cards — Coaches Contacted, Replies Received, **Reply Rate %** (oversized, hero number), Schools In Pipeline. Numbers animate on change.
2. **Replies-first layout**: Replies Panel moves above the coach database. Empty state copy: *"No replies yet — but coaches are reading. Keep going."* When unread > 0, a full-width red banner pins to the very top of the page: *"You have X new replies from college coaches. View them now."*
3. **Status dots in Past Outreach** sidebar: grey (Sent) / blue (Opened — placeholder, off until open tracking exists) / green + "Replied" badge. Auto-flips to Replied when a row in `coach_replies` matches that coach email + athlete.
4. **Pipeline board** below replies: 4 columns — Contacted, Replied, In Conversation, Official Interest. Tap a card to advance stage (drag-and-drop optional, tap-to-cycle ships first to avoid new deps). Auto-promotes Contacted → Replied on first reply from that school.
5. **Reply notification email** redesign: subject *"A college coach just replied to you"*, exciting body, CTA button "Read Their Reply", footer with current contact/reply/rate stats.
6. **In-app reply composer**: each reply card gets a "Reply" button → opens composer pre-filled with coach email + `Re:` subject, sends through existing `send-outreach-email` (alias from-address, quota counted).
7. **Profile completion checklist**: adds *"Send your first outreach email"* (+10%) and *"Receive your first coach reply"* (+10%).
8. **First-reply celebration**: one-time full-screen confetti + headline *"A college coach wants to talk to you."* + animated reply-rate. Triggered when `coach_replies` count goes 0 → 1; persisted via `profiles.first_reply_celebrated_at`.

## Technical plan

### Database (one migration)
- `outreach_history`: add `replied_at timestamptz`, `opened_at timestamptz`, `pipeline_stage text default 'contacted'` (values: contacted | replied | in_conversation | official_interest).
- `profiles`: add `first_reply_celebrated_at timestamptz`.
- Trigger on `coach_replies` insert → update matching `outreach_history` rows (same `athlete_id` + `coach_email`) set `replied_at = now()`, `status='replied'`, and bump `pipeline_stage` to `replied` if currently `contacted`. Also marks reply as the trigger for celebration check on client.

### Edge functions
- `sendgrid-inbound`: keep insert, rely on new trigger for outreach update. Update notification email body to new copy + stats (query counts before send).
- `send-outreach-email`: unchanged behavior; ensure new outreach rows seed `pipeline_stage='contacted'`.

### Frontend (`src/pages/Recruit.tsx` + new components)
- `RecruitStatsHero.tsx` — 4 animated metric cards using existing `animated-number` util.
- `UnreadRepliesBanner.tsx` — sticky red banner when unread count > 0.
- `RepliesPanel.tsx` (existing) — add Reply button → opens new `ReplyComposer.tsx` (lightweight wrapper around existing send flow).
- `PipelineBoard.tsx` — 4 columns, tap-to-advance stage, reads from `outreach_history` grouped by school + stage.
- `OutreachSidebar.tsx` — render status dot from row.status / replied_at.
- `FirstReplyCelebration.tsx` — full-screen overlay using pure CSS confetti keyframes (no new deps), shown once when celebration condition met, then writes `first_reply_celebrated_at`.
- `ProfileCompletionCard.tsx` — extend checklist with two new items based on counts.

### Layout order on `/recruit` main column
```
[ Unread replies banner (conditional) ]
[ Stats hero — 4 cards ]
[ Replies panel ]
[ Pipeline board ]
[ Map + filters + school list (existing) ]
```

### Out of scope (intentionally)
- True drag-and-drop (would add a dep) — tap-to-advance ships first.
- Real email-open tracking (no SendGrid event webhook yet) — Opened state stays grey until that lands.

## Files touched/created
- New: `RecruitStatsHero.tsx`, `UnreadRepliesBanner.tsx`, `PipelineBoard.tsx`, `ReplyComposer.tsx`, `FirstReplyCelebration.tsx`
- Edited: `Recruit.tsx`, `RepliesPanel.tsx`, `OutreachSidebar.tsx`, `ProfileCompletionCard.tsx`, `sendgrid-inbound/index.ts`
- Migration: outreach + profile columns + trigger

Approve to proceed.