import { and, asc, desc, eq, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, activities, rewardTypes, students } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { MILESTONE_STEP, dayLabel, tierOfPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

export async function GET() {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });
  await ensureSeeded();

  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY);
  const dayAgo = new Date(now - DAY);

  const [studentsRows, rewards, acts, milestoneRows, peerRows, recentLogs, todayRow, weekLogs] =
    await Promise.all([
      db.select().from(students).orderBy(desc(students.points), asc(students.name)),
      db.select().from(rewardTypes).orderBy(asc(rewardTypes.sortOrder)),
      db.select().from(activities),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(activityLogs)
        .where(eq(activityLogs.kind, "milestone")),
      db
        .select({
          studentId: activityLogs.studentId,
          pts: sql<number>`coalesce(sum(${activityLogs.points}), 0)::int`,
        })
        .from(activityLogs)
        .innerJoin(rewardTypes, eq(activityLogs.rewardTypeId, rewardTypes.id))
        .where(and(eq(rewardTypes.peer, true), eq(activityLogs.kind, "reward")))
        .groupBy(activityLogs.studentId),
      db
        .select({
          id: activityLogs.id,
          studentId: activityLogs.studentId,
          kind: activityLogs.kind,
          points: activityLogs.points,
          note: activityLogs.note,
          createdAt: activityLogs.createdAt,
          studentName: students.name,
          studentHue: students.hue,
          rewardLabel: rewardTypes.label,
        })
        .from(activityLogs)
        .innerJoin(students, eq(activityLogs.studentId, students.id))
        .leftJoin(rewardTypes, eq(activityLogs.rewardTypeId, rewardTypes.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(8),
      db
        .select({
          active: sql<number>`count(distinct ${activityLogs.studentId})::int`,
          pts: sql<number>`coalesce(sum(${activityLogs.points}), 0)::int`,
        })
        .from(activityLogs)
        .where(and(eq(activityLogs.kind, "reward"), gte(activityLogs.createdAt, dayAgo))),
      db
        .select({ createdAt: activityLogs.createdAt, points: activityLogs.points })
        .from(activityLogs)
        .where(and(eq(activityLogs.kind, "reward"), gte(activityLogs.createdAt, weekAgo))),
    ]);

  const tierCounts = { emerging: 0, steady: 0, shining: 0 };
  let totalPoints = 0;
  for (const s of studentsRows) {
    tierCounts[tierOfPoints(s.points)] += 1;
    totalPoints += s.points;
  }

  const peerMap = new Map<string, number>();
  for (const r of peerRows) {
    if (r.studentId) peerMap.set(r.studentId, r.pts);
  }
  let leader: { name: string; hue: number; peerPoints: number } | null = null;
  const maxPeer = Math.max(0, ...peerMap.values());
  if (maxPeer > 0) {
    const top = studentsRows.find((s) => peerMap.get(s.id) === maxPeer);
    if (top) leader = { name: top.name, hue: top.hue, peerPoints: maxPeer };
  } else if (studentsRows.length > 0) {
    leader = { name: studentsRows[0].name, hue: studentsRows[0].hue, peerPoints: 0 };
  }

  const byDay = new Map<string, number>();
  for (const log of weekLogs) {
    const key = log.createdAt.toDateString();
    byDay.set(key, (byDay.get(key) ?? 0) + log.points);
  }
  const weekSeries = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * DAY);
    return { label: dayLabel(d), value: byDay.get(d.toDateString()) ?? 0 };
  });

  const activeActivities = acts
    .filter((a) => a.status === "active")
    .sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity))
    .slice(0, 4);

  return Response.json({
    className: user.className,
    teacherName: user.name,
    teacherFirst: user.name.split(" ")[0],
    stats: {
      enrolled: studentsRows.length,
      activeToday: todayRow[0].active,
      totalPoints,
      todayPoints: todayRow[0].pts,
      milestones: milestoneRows[0].c,
      activeActivities: acts.filter((a) => a.status === "active").length,
      upcomingActivities: acts.filter((a) => a.status === "upcoming").length,
    },
    tierCounts,
    leader,
    students: studentsRows.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      tier: s.tier,
      points: s.points,
      hue: s.hue,
      milestones: Math.floor(s.points / MILESTONE_STEP),
      peerPoints: peerMap.get(s.id) ?? 0,
    })),
    rewardTypes: rewards.map((r) => ({
      id: r.id,
      label: r.label,
      points: r.points,
      tone: r.tone,
      icon: r.icon,
      peer: r.peer,
    })),
    weekSeries,
    recentLogs: recentLogs.map((l) => ({
      ...l,
      kind: l.kind === "milestone" ? "milestone" : "reward",
      createdAt: l.createdAt.toISOString(),
    })),
    leaderboard: studentsRows.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      hue: s.hue,
      points: s.points,
      nextMilestone: (Math.floor(s.points / MILESTONE_STEP) + 1) * MILESTONE_STEP,
    })),
    activeActivities: activeActivities.map((a) => ({
      id: a.id,
      title: a.title,
      kind: a.kind,
      points: a.points,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    })),
  });
}
