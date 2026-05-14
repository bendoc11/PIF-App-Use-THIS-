/**
 * Resolve the coach's display name for replies and threads.
 *
 * The inbound parser stores the From-header display name, which during
 * testing can be the athlete's own name. We always prefer the matched
 * outreach record (the row the athlete created when sending), then a
 * reasonable fallback derived from the email address.
 */

function titleCase(s: string) {
  return s
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function lastNameOf(full: string | null | undefined): string | null {
  if (!full) return null;
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return parts[parts.length - 1];
}

function localPartName(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = email.split("@")[0];
  if (!local) return null;
  // strip trailing digits (e.g. jsmith23 -> jsmith)
  const cleaned = local.replace(/\d+$/, "").replace(/[._-]+/g, " ").trim();
  if (!cleaned) return null;
  return titleCase(cleaned);
}

function normalize(s: string | null | undefined) {
  return (s || "").trim().toLowerCase();
}

export interface CoachIdentityInput {
  /** The athlete's own full name — never displayed as the sender. */
  athleteName: string | null;
  /** Coach name from the matched outreach_history row (most trustworthy). */
  outreachCoachName: string | null;
  /** Coach title from the matched outreach_history row. */
  outreachCoachTitle: string | null;
  /** Coach name as parsed from the inbound reply From-header. */
  replyCoachName: string | null;
  /** Coach email (used for fallback name and as last resort). */
  coachEmail: string | null;
}

/**
 * Returns a coach display name that is guaranteed to never be the athlete's
 * own name. Prefers "Coach LastName" when we can derive a last name.
 */
export function resolveCoachDisplayName(input: CoachIdentityInput): string {
  const athlete = normalize(input.athleteName);

  const isAthlete = (candidate: string | null | undefined) =>
    !!candidate && athlete && normalize(candidate) === athlete;

  // 1. Outreach record — the row the athlete created when sending the email.
  if (input.outreachCoachName && !isAthlete(input.outreachCoachName)) {
    const last = lastNameOf(input.outreachCoachName);
    if (last) return `Coach ${last}`;
    return input.outreachCoachName.trim();
  }

  // 2. From-header name on the reply, but only if it doesn't match the athlete.
  if (input.replyCoachName && !isAthlete(input.replyCoachName)) {
    const last = lastNameOf(input.replyCoachName);
    if (last) return `Coach ${last}`;
    return input.replyCoachName.trim();
  }

  // 3. Title may include "Head Coach Smith" — use as-is if it has a name.
  if (input.outreachCoachTitle && /coach/i.test(input.outreachCoachTitle)) {
    return input.outreachCoachTitle.trim();
  }

  // 4. Email local-part fallback.
  const fromEmail = localPartName(input.coachEmail);
  if (fromEmail) {
    const last = lastNameOf(fromEmail) ?? fromEmail;
    return `Coach ${last}`;
  }

  return "Coach";
}

export function initialsFromCoach(displayName: string, fallbackSchool: string | null = null): string {
  // Strip leading "Coach " for cleaner initials
  const stripped = displayName.replace(/^coach\s+/i, "").trim();
  const src = stripped || fallbackSchool || displayName || "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
