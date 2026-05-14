# Recruiting Engagement Upgrade — 8-Part Plan

Goal: convert the recruiting flow from a functional inbox into a habit-forming product with clear momentum, celebration moments, and trustworthy recommendations.

---

## 1. Reply sender name (quick fix, do first)

The inbound parser is storing the From-header display name, which in test mode happens to be the athlete's own name. Fix the **display logic** so reply rows + thread headers always show the *coach* identity:

- Lookup precedence: `outreach_history.coach_name` (matched by `coach_email`) → parsed coach name from `reply_subject` → email local-part → "Coach".
- If `coach_title` exists and contains a last name, render `Coach {LastName}`.
- Never fall back to the athlete's own profile name.

Files: `RepliesPanel.tsx`, `ConversationThread.tsx`.

---

## 2. Prominent progress bar with milestones

Replace the thin line on `/recruit` with a real progress bar component.

- Track: total `outreach_history` rows for the user.
- Markers at 10 / 20 / 50 with labels: *Getting noticed*, *Building momentum*, *Maximizing chances*.
- Filled segments use PIF red gradient; passed milestones get a checkmark.
- Crossing a milestone fires the celebration in §3 (once-per-milestone).

New component: `RecruitProgressBar.tsx`. Replaces the current top progress strip.

---

## 3. Milestone + weekly-goal celebrations (one-time per milestone)

Add a lightweight celebration overlay (confetti via pure CSS keyframes — no new deps) that triggers on:

- Crossing 10, 20, 50 lifetime sends.
- Hitting weekly goal of 10 sends (resets Mondays, local time).
- Each fires only once per user per milestone.

Persist completion state in a new table `user_milestones`:

```text
user_id uuid
milestone_key text    -- 'sends_10' | 'sends_20' | 'sends_50' | 'weekly_2026_W20'
achieved_at timestamptz
PK (user_id, milestone_key)
```

Client checks unseen milestones on mount + after each successful send and inserts the row when the celebration is shown.

Component: `MilestoneCelebration.tsx`.

---

## 4. First-reply celebration

Before opening the first ever reply (subscribed users only), show a full-screen moment:

- Large school initials in school color.
- Headline: *A coach responded to your outreach!*
- Subline: *Your recruiting process just got real.*
- Button: *Read their message.*

Uses existing `profiles.first_reply_celebrated_at` column — already present, set on dismiss. Component: `FirstReplyCelebration.tsx` (file already exists — wire it in).

---

## 5. Separate "Schools I'm Interested In" vs "Schools Interested In Me"

Today both states collapse into one count. Split them:

- **Schools I'm Interested In** — count of `target_schools` rows (athlete bookmarks). Star icon, neutral color.
- **Schools Interested In Me** — distinct schools with at least one `coach_replies` row. Flame icon, gold (#F5B82E).

Update both the right sidebar card (`YourSchoolsCard.tsx`) and any dashboard stat tiles to render two stacked rows instead of one number.

---

## 6. Send streak

Daily consecutive-send streak shown next to the user name in `RecruitTopBar` and inside the weekly widget.

- Compute on the client from `outreach_history.sent_at` grouped by local calendar date (same approach as existing training streak).
- Small flame icon + number; muted when 0.
- Push-notification copy is documented for later — Capacitor push is out of scope for this task.

---

## 7. Recommended schools relevance

Today recommendations are not regional. Update `RecommendedSchools.tsx` to:

1. Filter `college_coaches` by `profiles.target_division` if set.
2. Sort by region match against `profiles.state` (Mid-Atlantic, Northeast, South, Midwest, West buckets).
3. Section label: *Recruiting in your region*.
4. Fall back to nationwide only if fewer than 6 regional matches exist.

Region map lives in a new `src/lib/regions.ts`.

---

## 8. Social proof ticker

Subtle rotating line below the map:

- Pulls anonymized aggregates from Supabase: total messages sent platform-wide this week, count of athletes who got at least one reply this week.
- Rotates every 5s between 2–3 lines.
- If counts are low, falls back to plausible templated lines marked clearly (no fake exact numbers).

Aggregate query exposed via SQL function `get_platform_activity_stats()` returning `messages_this_week`, `athletes_replied_this_week`. SECURITY DEFINER, callable by authenticated.

---

## Database changes (one migration)

- New table `user_milestones` + RLS (user can read/insert own).
- New SQL function `get_platform_activity_stats()`.

No changes to existing tables.

---

## Sequencing

1. Migration (table + function).
2. Bug-fix #1 (reply sender name) — fastest visible win.
3. #5 (split school states) + #7 (regional recs) — trust fixes.
4. #2 progress bar + #3 milestone celebrations + #6 streak — momentum loop.
5. #4 first-reply celebration + #8 social proof ticker — polish.

## What's explicitly out of scope

- Real push notifications for streak risk (Capacitor wiring is its own task).
- Backfilling historical milestones into `user_milestones` — current users won't see celebrations for milestones they already passed.
- New analytics events / Mixpanel.

Confirm and I'll start with the migration.
