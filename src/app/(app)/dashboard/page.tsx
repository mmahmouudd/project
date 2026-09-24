"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Avatar, EmptyState, Skeleton, TierBadge, useToast, btnPrimary } from "@/components/ui";
import { MILESTONE_STEP, TONE_META, fmtDay, greeting, tierOfPoints, timeAgo } from "@/lib/format";
import type { BoardStudent, RecentLogRow, RewardRow, StatsPayload } from "@/lib/types";

interface Floater {
  key: number;
  studentId: string;
  points: number;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  delay,
  children,
}: {
  icon: IconName;
  label: string;
  value?: string | number;
  sub?: string;
  delay: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`card reveal ${delay} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-[0.14em] text-ink-400 uppercase">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100 text-sage-700">
          <Icon name={icon} className="h-4.5 w-4.5" />
        </span>
      </div>
      {children ?? (
        <>
          <p className="mt-3 font-display text-[2.1rem] leading-none text-ink-900">{value}</p>
          {sub && <p className="mt-2 text-[12px] font-medium text-ink-500">{sub}</p>}
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-14 w-72" />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[118px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[420px] lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[170px]" />
        </div>
      </div>
      <Skeleton className="mt-4 h-[150px]" />
    </div>
  );
}

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("stats");
      setStats((await res.json()) as StatsPayload);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function pushFloater(studentId: string, points: number) {
    const key = Date.now() + Math.random();
    setFloaters((f) => [...f, { key, studentId, points }]);
    window.setTimeout(() => {
      setFloaters((f) => f.filter((x) => x.key !== key));
    }, 1000);
  }

  /** Optimistic 1-tap micro-reward with automatic rollback on failure. */
  async function award(student: BoardStudent, reward: RewardRow) {
    if (!stats) return;
    const prevStudents = stats.students;
    const prevStats = stats.stats;

    setStats((s) =>
      s
        ? {
            ...s,
            stats: { ...s.stats, totalPoints: s.stats.totalPoints + reward.points, todayPoints: s.stats.todayPoints + reward.points },
            students: s.students.map((st) =>
              st.id === student.id
                ? {
                    ...st,
                    points: st.points + reward.points,
                    tier: tierOfPoints(st.points + reward.points),
                    milestones: Math.floor((st.points + reward.points) / MILESTONE_STEP),
                    peerPoints: st.peerPoints + (reward.peer ? reward.points : 0),
                  }
                : st,
            ),
          }
        : s,
    );
    pushFloater(student.id, reward.points);

    try {
      const res = await fetch("/api/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, rewardTypeId: reward.id }),
      });
      if (!res.ok) throw new Error("award");
      const data = (await res.json()) as { milestone: string | null; student: BoardStudent };
      if (data.milestone) {
        setStats((s) =>
          s ? { ...s, stats: { ...s.stats, milestones: s.stats.milestones + 1 } } : s,
        );
        toast(`${data.student.name} reached the ${data.milestone} milestone`, "success");
      }
    } catch {
      // Auto-rollback
      setStats((s) =>
        s
          ? {
              ...s,
              students: prevStudents,
              stats: prevStats,
            }
          : s,
      );
      toast("Couldn't record that moment — change rolled back", "error");
    }
  }

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="card">
        <EmptyState
          icon="refresh"
          title="The board isn't responding"
          hint="We couldn't load the class pulse. Give it another tap."
          action={
            <button type="button" onClick={load} className={btnPrimary}>
              <Icon name="refresh" className="h-4 w-4" />
              Retry
            </button>
          }
        />
      </div>
    );
  }

  const { stats: s } = stats;
  const weekMax = Math.max(1, ...stats.weekSeries.map((w) => w.value));

  return (
    <div>
      {/* Greeting */}
      <div className="reveal mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-sage-600 uppercase">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-ink-900">
            {greeting()}, {stats.teacherFirst}
          </h1>
          <p className="mt-1 text-sm text-ink-500">{stats.className} · here's how the class is holding up.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-sand-300 bg-white/70 py-1.5 pr-4 pl-1.5 text-[12px] font-semibold text-ink-600 shadow-sm">
          <Avatar name={stats.teacherName} hue={152} className="h-7 w-7 text-[10px]" />
          Smartboard · session active
        </div>
      </div>

      {/* Stat row */}
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon="users" label="Active Students" value={s.activeToday} sub={`of ${s.enrolled} enrolled are engaged today`} delay="reveal-d1" />
        <StatCard icon="sparkle" label="Class Points" value={s.totalPoints} sub={`+${s.todayPoints} in the last 24h`} delay="reveal-d2" />
        <StatCard icon="award" label="Milestones" value={s.milestones} sub={`${s.activeActivities} activities running now`} delay="reveal-d3" />
        <div className="card reveal reveal-d4 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-[0.14em] text-ink-400 uppercase">Peer Support Leader</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-peach-100 text-peach-500">
              <Icon name="heart" className="h-4.5 w-4.5" />
            </span>
          </div>
          {stats.leader ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="breathe rounded-full">
                <Avatar name={stats.leader.name} hue={stats.leader.hue} className="h-10 w-10 text-sm" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight text-ink-900">{stats.leader.name}</p>
                <p className="text-[12px] font-medium text-ink-500">
                  {stats.leader.peerPoints} pts from helping others
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">Waiting for the first kind act…</p>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Micro-Reward Board */}
        <section className="card reveal reveal-d2 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 px-5 py-4">
            <div>
              <h2 className="font-display text-lg text-ink-900">Micro-Reward Board</h2>
              <p className="text-[12px] text-ink-500">One tap, gentle praise — tallies update instantly.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.rewardTypes.map((r) => (
                <span
                  key={r.id}
                  title={`${r.label} +${r.points}${r.peer ? " · peer reward" : ""}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONE_META[r.tone].chip}`}
                >
                  <Icon name={r.icon as IconName} className="h-3.5 w-3.5" />
                  {r.label} +{r.points}
                </span>
              ))}
            </div>
          </div>

          {stats.students.length === 0 ? (
            <EmptyState
              icon="users"
              title="No learners on the board yet"
              hint="Add your first student to the registry and they'll appear here, ready for their first tap."
              action={
                <Link href="/students" className={btnPrimary}>
                  <Icon name="plus" className="h-4 w-4" />
                  Open Student Registry
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-sand-200/80">
              {stats.students.map((st) => (
                <li key={st.id} className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 transition hover:bg-sage-50/60">
                  <div className="flex min-w-0 flex-1 basis-44 items-center gap-3">
                    <Avatar name={st.name} hue={st.hue} className="h-10 w-10 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{st.name}</p>
                      <p className="text-[11px] text-ink-400">Year {st.grade}</p>
                    </div>
                    <TierBadge tier={st.tier} className="ml-1 hidden md:inline-flex" />
                  </div>

                  <div className="relative flex items-center gap-1 rounded-full border border-sand-200 bg-white/80 px-3 py-1">
                    <span key={st.points} className="tick font-display text-[15px] font-semibold text-ink-900">
                      {st.points}
                    </span>
                    <span className="text-[10px] font-semibold text-ink-400">pts</span>
                    {floaters
                      .filter((f) => f.studentId === st.id)
                      .map((f) => (
                        <span
                          key={f.key}
                          className="float-chip pointer-events-none absolute -top-1 left-1/2 rounded-full bg-sage-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
                        >
                          +{f.points}
                        </span>
                      ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {stats.rewardTypes.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => award(st, r)}
                        title={`${st.name} · ${r.label} +${r.points}`}
                        aria-label={`Give ${st.name} ${r.label} plus ${r.points} points`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition duration-150 hover:scale-110 hover:ring-2 hover:ring-sage-300/60 active:scale-90 ${TONE_META[r.tone].dot}`}
                      >
                        <Icon name={r.icon as IconName} className="h-4 w-4" strokeWidth={1.9} />
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Weekly pulse */}
          <section className="card reveal reveal-d3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink-900">Weekly Pulse</h2>
              <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-semibold text-ink-500">
                {stats.weekSeries.reduce((a, b) => a + b.value, 0)} pts this week
              </span>
            </div>
            <div className="mt-4 flex h-24 items-end gap-2">
              {stats.weekSeries.map((w, i) => {
                const isToday = i === stats.weekSeries.length - 1;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="relative flex h-16 w-full items-end justify-center">
                      <div
                        title={`${w.value} points`}
                        className={`bar-grow w-full max-w-7 rounded-md ${
                          isToday ? "bg-peach-300" : "bg-sage-200"
                        }`}
                        style={{
                          height: `${Math.max(8, (w.value / weekMax) * 100)}%`,
                          animationDelay: `${i * 60}ms`,
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${isToday ? "text-peach-500" : "text-ink-400"}`}>
                      {w.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent moments */}
          <section className="card reveal reveal-d4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink-900">Recent Moments</h2>
              <Link
                href="/log"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-sage-700 transition hover:text-sage-800"
              >
                Full log <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-3 space-y-3">
              {stats.recentLogs.slice(0, 6).map((l: RecentLogRow) => (
                <li key={l.id} className="flex items-center gap-3">
                  {l.kind === "milestone" ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach-100 text-peach-500">
                      <Icon name="star" className="h-4 w-4" />
                    </span>
                  ) : (
                    <Avatar name={l.studentName} hue={l.studentHue} className="h-8 w-8 text-[10px]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink-800">
                      {l.kind === "milestone" ? (
                        <>
                          <span className="font-semibold">{l.studentName}</span> — {l.note}
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{l.studentName}</span> · {l.rewardLabel}
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-ink-400">{timeAgo(l.createdAt)}</p>
                  </div>
                  {l.kind === "reward" && l.points > 0 && (
                    <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-bold text-sage-700">
                      +{l.points}
                    </span>
                  )}
                </li>
              ))}
              {stats.recentLogs.length === 0 && (
                <p className="py-4 text-center text-sm text-ink-400">No moments yet — the day is young.</p>
              )}
            </ul>
          </section>
        </div>
      </div>

      {/* Bottom row: leaders + active activities */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card reveal reveal-d4 p-5">
          <h2 className="font-display text-lg text-ink-900">Top of the Class</h2>
          <p className="text-[12px] text-ink-500">Progress toward the next {MILESTONE_STEP}-point milestone.</p>
          <ul className="mt-4 space-y-3.5">
            {stats.leaderboard.map((l, i) => {
              const pct = Math.min(100, Math.round((l.points / l.nextMilestone) * 100));
              return (
                <li key={l.id} className="flex items-center gap-3">
                  <span className="w-4 text-center font-display text-sm text-ink-400">{i + 1}</span>
                  <Avatar name={l.name} hue={l.hue} className="h-8 w-8 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink-800">{l.name}</p>
                      <p className="text-[11px] font-medium text-ink-400">
                        {l.points} / {l.nextMilestone}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-200">
                      <div
                        className={`h-full rounded-full ${i === 0 ? "bg-peach-400" : "bg-sage-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
            {stats.leaderboard.length === 0 && (
              <p className="py-3 text-center text-sm text-ink-400">No tallies yet.</p>
            )}
          </ul>
        </section>

        <section className="card reveal reveal-d5 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg text-ink-900">Happening in Class</h2>
              <p className="text-[12px] text-ink-500">
                {s.activeActivities} active · {s.upcomingActivities} upcoming
              </p>
            </div>
            <Link
              href="/activities"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-ink-700 transition hover:bg-sand-100 active:scale-95"
            >
              Activities hub <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {stats.activeActivities.map((a) => (
              <div
                key={a.id}
                className="group flex items-start gap-3 rounded-xl border border-sand-200 bg-white/70 p-3.5 transition hover:border-sage-300 hover:shadow-sm"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-sage-700 transition group-hover:bg-sage-200">
                  <Icon name={a.kind === "trip" ? "compass" : a.kind === "assignment" ? "book" : "flag"} className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{a.title}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-ink-400">
                    <span className="rounded-full bg-peach-100 px-2 py-0.5 font-bold text-peach-600">+{a.points} pts</span>
                    {a.dueDate && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="calendar" className="h-3.5 w-3.5" />
                        {fmtDay(a.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {stats.activeActivities.length === 0 && (
              <p className="col-span-full py-4 text-center text-sm text-ink-400">
                Nothing running right now — open the Activities hub to start one.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Footer strip */}
      <p className="mt-6 flex items-center gap-2 text-[11px] text-ink-400">
        <Icon name="leaf" className="h-3.5 w-3.5" />
        Tier guide: Emerging 0–24 · Steady 25–59 · Shining 60+ — tiers refresh automatically as points land.
      </p>
    </div>
  );
}
