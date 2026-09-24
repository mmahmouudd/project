import type { ActivityKind, RewardTone, Tier } from "@/lib/format";

export interface StudentRow {
  id: string;
  name: string;
  grade: number;
  tier: Tier;
  points: number;
  hue: number;
  notes: string | null;
  enrolledAt: string;
  createdAt: string;
}

export interface BoardStudent {
  id: string;
  name: string;
  grade: number;
  tier: Tier;
  points: number;
  hue: number;
  milestones: number;
  peerPoints: number;
}

export interface RewardRow {
  id: string;
  label: string;
  points: number;
  tone: RewardTone;
  icon: string;
  peer: boolean;
}

export interface ActivityRow {
  id: string;
  title: string;
  kind: ActivityKind;
  description: string | null;
  points: number;
  status: "upcoming" | "active" | "completed";
  dueDate: string | null;
  createdAt: string;
}

export interface RecentLogRow {
  id: string;
  studentId: string | null;
  studentName: string;
  studentHue: number;
  kind: "reward" | "milestone";
  points: number;
  note: string | null;
  rewardLabel: string | null;
  createdAt: string;
}

export interface LogRow {
  id: string;
  kind: "reward" | "milestone";
  points: number;
  note: string | null;
  createdAt: string;
  studentId: string | null;
  studentName: string | null;
  studentHue: number;
  rewardLabel: string | null;
}

export interface StatsPayload {
  className: string;
  teacherName: string;
  teacherFirst: string;
  stats: {
    enrolled: number;
    activeToday: number;
    totalPoints: number;
    todayPoints: number;
    milestones: number;
    activeActivities: number;
    upcomingActivities: number;
  };
  tierCounts: { emerging: number; steady: number; shining: number };
  leader: { name: string; hue: number; peerPoints: number } | null;
  students: BoardStudent[];
  rewardTypes: RewardRow[];
  weekSeries: { label: string; value: number }[];
  recentLogs: RecentLogRow[];
  leaderboard: { id: string; name: string; hue: number; points: number; nextMilestone: number }[];
  activeActivities: {
    id: string;
    title: string;
    kind: ActivityKind;
    points: number;
    dueDate: string | null;
  }[];
}
