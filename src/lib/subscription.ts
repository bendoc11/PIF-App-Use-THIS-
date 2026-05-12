// Single source of truth for whether a user is a paid subscriber.
// Mirrors the logic used in edge functions and the Paywall page.

const ACTIVE_STATUSES = ["active", "trialing", "trial", "past_due"];
const PAID_PLANS = ["pro", "premium", "lifetime"];

export function isPaidSubscriber(profile: any, hasActiveSubscriptionRow = false): boolean {
  if (hasActiveSubscriptionRow) return true;
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "creator") return true;
  if (profile.plan && PAID_PLANS.includes(profile.plan)) return true;
  if (profile.subscription_status && ACTIVE_STATUSES.includes(profile.subscription_status)) return true;
  return false;
}

export const FREE_DAILY_SEND_LIMIT = 30;
export const SUBSCRIPTION_PRICE_DISPLAY = "$29/month";
export const STRIPE_CHECKOUT_URL =
  "https://subscribe.playitforward.app/b/4gM00i4Wzc0g7w0buvcEw00";
