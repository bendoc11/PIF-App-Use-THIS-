# Monetization Overhaul Plan

## What changes

Replace the current paywall system (lifetime free-send cap, FreemiumPaywall, Paywall route, post-onboarding paywall) with a daily-limit + locked-replies model.

## 1. Cleanup (remove old system)

- Delete `src/components/recruit/FreemiumPaywall.tsx` and all references in `Recruit.tsx` / `EmailComposer.tsx`.
- Remove `free_sends_used` lifetime gating in `send-outreach-email` (keep the function shape — only swap the limit logic).
- Strip paywall checks from `Pricing.tsx`, `OnboardingResults.tsx`, `SignupSuccess.tsx`, `AuthGuard.tsx` (already permissive — just confirm).
- Keep `Paywall.tsx` route reachable but route post-onboarding straight to dashboard.

## 2. Daily send limit (30/day for free users)

- Reuse existing `email_send_counters(user_id, day, count)` table.
- Update `send-outreach-email` edge function:
  - Look up active subscription (profiles.subscription_status in active/trialing OR plan in pro/premium/lifetime OR role admin/creator) → unlimited.
  - Otherwise: increment today's counter; if `>30` return `{ error: 'daily_limit_reached', limit: 30 }` with 429.
- Frontend `EmailComposer` catches that error and opens the new `DailyLimitPaywall` modal (non-dismissable; only Subscribe / Restore).

## 3. Replies tab (new)

- Add route `/replies` and a `<Replies />` page.
- Sidebar order: Get Recruited → **Replies** → My Profile → My Progress.
- Tab shows red badge with unread reply count (reuse `useUnreadReplies`, realtime already wired).
- For paid users: full reply list + reply composer (reuse `RepliesPanel`/`ReplyComposer`).
- For free users: locked screen — large red lock icon, list of locked cards (coach name + school + title visible, body blurred), CTA to subscribe.

## 4. Subscription helper

- New `src/lib/subscription.ts` exporting `isPaidSubscriber(profile)` (admin/creator/active sub).
- Replace `hasActiveSubscription` usages where needed.

## 5. Stripe success flow

- Stripe success URL → `/signup-success?verified=true`.
- `SignupSuccess` page calls `check-subscription`, shows brief celebration, then redirects to `/replies`.
- Insert into `subscriptions` table on success.

## 6. Reply notification email (free users)

- New edge function `notify-reply-received`:
  - Triggered from `sendgrid-inbound` (DO NOT modify that function — instead, add a Postgres trigger on `coach_replies` insert that calls this via pg_net, OR call it from sendgrid-inbound).
  - **Constraint says don't modify sendgrid-inbound** → use a database trigger on `coach_replies` insert that uses `pg_net.http_post` to invoke the function.
  - Function checks if recipient is free (not paid sub). If free, sends branded email via SendGrid: "A college coach replied to your recruiting outreach" with body "Hey {first_name} — {coach_name} from {school} just responded…".

## 7. Onboarding copy

- Update `OnboardingResults.tsx` to: "Your profile is live. Start reaching out to coaches — completely free. When coaches reply you'll be notified instantly. Subscribe to read their replies and keep the conversation going." Remove all paywall mentions.

## 8. New paywall modal component

- `src/components/paywall/DailyLimitPaywall.tsx` — full-screen, non-dismissable, used when daily 30 cap is hit.
- Contains the exact copy from spec, $29/month red text, Stripe link, restore button.

## Stripe link

The user said `[PASTE YOUR STRIPE LINK]` — I'll reuse the existing checkout URL from `Paywall.tsx` (`https://subscribe.playitforward.app/b/4gM00i4Wzc0g7w0buvcEw00`). Confirm or provide a different link before launch.

## Files touched

Created:
- `src/pages/Replies.tsx`
- `src/components/paywall/DailyLimitPaywall.tsx`
- `src/components/replies/LockedRepliesView.tsx`
- `src/lib/subscription.ts`
- `supabase/functions/notify-reply-received/index.ts`
- migration: trigger on `coach_replies` insert + drop unused `free_sends_used` references

Edited:
- `supabase/functions/send-outreach-email/index.ts` (daily 30 cap)
- `src/components/recruit/EmailComposer.tsx` (handle 429 → modal)
- `src/components/layout/AppSidebar.tsx` (new tab + badge)
- `src/App.tsx` (route)
- `src/pages/SignupSuccess.tsx` (celebrate → /replies)
- `src/pages/OnboardingResults.tsx` (copy + redirect target)
- `src/pages/Recruit.tsx` (remove FreemiumPaywall)

Deleted:
- `src/components/recruit/FreemiumPaywall.tsx`

## Open questions before I build

1. **Confirm the Stripe payment link** — reuse `https://subscribe.playitforward.app/b/4gM00i4Wzc0g7w0buvcEw00`, or paste a new one? (Spec literally said `[PASTE YOUR STRIPE LINK]`.)
2. The existing checkout price is $49.99 — your new spec says **$29/month**. The Stripe link controls actual price; I'll only update display copy. Confirm the link points to a $29 price.
3. The "test in Chrome incognito" step — I can't drive a real browser session through Stripe, sign up, send 30 emails, etc. I'll do code-level verification + smoke test the UI states. OK?
