export const MILESTONE_STEP = 25;

export type Tier = "emerging" | "steady" | "shining";

export function tierOfPoints(points: number): Tier {
  if (points >= 60) return "shining";
  if (points >= 25) return "steady";
  return "emerging";
}

export const TIER_META: Record<Tier, { label: string; dot: string; badge: string }> = {
  emerging: {
    label: "Emerging",
    dot: "bg-sand-400",
    badge: "bg-sand-200/70 text-ink-700 ring-sand-300/70",
  },
  steady: {
    label: "Steady",
    dot: "bg-sage-400",
    badge: "bg-sage-100 text-sage-800 ring-sage-200",
  },
  shining: {
    label: "Shining",
    dot: "bg-peach-400",
    badge: "bg-peach-100 text-peach-600 ring-peach-200",
  },
};

export type ActivityKind = "challenge" | "trip" | "assignment";
export type ActivityStatus = "upcoming" | "active" | "completed";

export const KIND_META: Record<
  ActivityKind,
  { label: string; icon: string; chip: string }
> = {
  challenge: { label: "Challenge", icon: "flag", chip: "bg-sage-100 text-sage-800" },
  trip: { label: "Trip", icon: "compass", chip: "bg-peach-100 text-peach-600" },
  assignment: { label: "Assignment", icon: "book", chip: "bg-sand-200/80 text-ink-700" },
};

export const STATUS_META: Record<
  ActivityStatus,
  { label: string; chip: string; dot: string }
> = {
  upcoming: { label: "Upcoming", chip: "bg-sand-200/70 text-ink-700", dot: "bg-ink-300" },
  active: { label: "Active", chip: "bg-sage-100 text-sage-800", dot: "bg-sage-500" },
  completed: { label: "Completed", chip: "bg-peach-100 text-peach-600", dot: "bg-peach-400" },
};

export type RewardTone = "sage" | "peach" | "sand";

export const TONE_META: Record<RewardTone, { dot: string; chip: string }> = {
  sage: {
    dot: "bg-sage-100 text-sage-700 hover:bg-sage-200",
    chip: "bg-sage-100 text-sage-800",
  },
  peach: {
    dot: "bg-peach-100 text-peach-500 hover:bg-peach-200",
    chip: "bg-peach-100 text-peach-600",
  },
  sand: {
    dot: "bg-sand-200 text-ink-700 hover:bg-sand-300/80",
    chip: "bg-sand-200 text-ink-700",
  },
};

export function timeAgo(value: string | Date): string {
  const then = new Date(value).getTime();
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function fmtDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDay(value: string | Date): string {
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || "·";
}

export function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2);
}
