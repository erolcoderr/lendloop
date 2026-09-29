import type { RequestStatus, ItemStatus, ReservationStatus, Review, User, VerificationStatus } from "./types";

/**
 * Shared helpers (the "core JS helpers" from the LendLoop brief, adapted to TS).
 * Every non-trivial function carries a short docblock explaining WHY it exists.
 */

/* ------------------------------------------------------------------ dates */

/** Format an ISO date as "MMM DD, YYYY" for friendly, human-readable timelines. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/** Relative time like "3h ago" / "2d ago" for notification feeds. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return formatDate(iso);
}

/** Returns the list of yyyy-mm-dd date strings between two inclusive dates. */
export function dateRangeToDays(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;
  const cur = new Date(start);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ money */

/** Philippine Peso formatting — the prototype's community context is PH. */
export function formatPeso(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ------------------------------------------------------------------ trust */

/**
 * Trust score (0–100) — new formula:
 *  - Base: 50 (every new member starts here)
 *  - + up to 30 from review ratings (avg stars × 6, capped at 30)
 *  - + social link bonuses (each admin-approved link adds +1, +2, or +3)
 *
 * This rewards community participation (reviews) and identity verification
 * (social media links approved by the admin).
 */
export function calculateTrustScore(
  reviews: Review[],
  socialBonus = 0,
  trustAdjustment = 0,
): number {
  const base = 60; // every member starts at 60
  let score = base + socialBonus + trustAdjustment;
  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    const reviewBonus = Math.min(30, (avg / 5) * 30); // max 30 from reviews
    score += reviewBonus;
  }
  // Clamp: trust score can't go below 0 or above 100
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function trustTier(score: number): {
  label: string;
  tone: "emerald" | "amber" | "rose";
} {
  if (score >= 85) return { label: "Highly Trusted", tone: "emerald" };
  if (score >= 70) return { label: "Trusted", tone: "emerald" };
  if (score >= 55) return { label: "Building Trust", tone: "amber" };
  return { label: "New Member", tone: "amber" };
}

/* ------------------------------------------------------------------ async */

/**
 * Returns a Promise that resolves after `delay` ms — simulates server latency
 * so the prototype shows spinners / toasts realistically without a backend.
 */
export function simulateApiCall<T>(payload: T, delay = 700): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(payload), delay));
}

/* ------------------------------------------------------------------ status meta */

/**
 * Single source of truth for status -> {label, classes, dot} so badges never
 * drift across views (Context Engineering skill). Warm-leaning palette, WCAG AA.
 */
export const REQUEST_STATUS_META: Record<
  RequestStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label: "Pending",
    classes: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    classes: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30",
    dot: "bg-teal-500",
  },
  borrowed: {
    label: "Borrowed",
    classes: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
    dot: "bg-orange-500",
  },
  returned: {
    label: "Returned",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dot: "bg-rose-400",
  },
};

export const ITEM_STATUS_META: Record<
  ItemStatus,
  { label: string; classes: string; dot: string }
> = {
  available: {
    label: "Available",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  reserved: {
    label: "Reserved",
    classes: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  borrowed: {
    label: "Borrowed",
    classes: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
    dot: "bg-orange-500",
  },
};

export const RESERVATION_STATUS_META: Record<
  ReservationStatus,
  { label: string; classes: string; dot: string }
> = {
  active: {
    label: "Active",
    classes: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30",
    dot: "bg-teal-500",
  },
  fulfilled: {
    label: "Fulfilled",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
  expired: {
    label: "Expired",
    classes: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/30",
    dot: "bg-zinc-400",
  },
};

export const VERIFICATION_STATUS_META: Record<
  VerificationStatus,
  { label: string; classes: string; dot: string }
> = {
  unverified: {
    label: "Unverified",
    classes: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/30",
    dot: "bg-zinc-400",
  },
  pending: {
    label: "Pending",
    classes: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
};

/* ------------------------------------------------------------------ misc */

/** Password strength 0..4 used by the register view's meter. */
export function passwordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-zinc-300",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-emerald-500",
  ];
  return { score, label: labels[score], color: colors[score] };
}

/** Initials used by the avatar fallback. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Simple email format check for client-side validation. */
export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Average rating helper. */
export function avgRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

/** Find a user by id safely. */
export function userById(users: User[], id: string): User | undefined {
  return users.find((u) => u.id === id);
}
