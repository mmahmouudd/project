"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  Avatar,
  EmptyState,
  PageHeader,
  Skeleton,
  btnGhost,
  btnPrimary,
  inputCls,
} from "@/components/ui";
import { fmtDay, timeAgo } from "@/lib/format";
import type { LogRow, StudentRow } from "@/lib/types";

export default function LogPage() {
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [error, setError] = useState(false);
  const [student, setStudent] = useState("all");
  const [kind, setKind] = useState<"all" | "reward" | "milestone">("all");

  const load = useCallback(async () => {
    setError(false);
    try {
      const [logRes, stuRes] = await Promise.all([
        fetch("/api/logs?limit=120"),
        fetch("/api/students"),
      ]);
      if (!logRes.ok || !stuRes.ok) throw new Error("logs");
      setLogs((await logRes.json()) as LogRow[]);
      setStudents((await stuRes.json()) as StudentRow[]);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs.filter((l) => {
      if (student !== "all" && l.studentId !== student) return false;
      if (kind !== "all" && l.kind !== kind) return false;
      return true;
    });
  }, [logs, student, kind]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; rows: LogRow[] }>();
    for (const l of filtered) {
      const label = fmtDay(l.createdAt);
      if (!map.has(label)) map.set(label, { label, rows: [] });
      map.get(label)!.rows.push(l);
    }
    return Array.from(map.values());
  }, [filtered]);

  const hasFilters = student !== "all" || kind !== "all";
  const loading = logs === null && !error;

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-14 w-64" />
        <Skeleton className="mb-5 h-12" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <EmptyState
          icon="refresh"
          title="The log couldn't be reached"
          hint="Every moment is safe — try again."
          action={
            <button type="button" className={btnPrimary} onClick={load}>
              <Icon name="refresh" className="h-4 w-4" /> Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Behavior Log"
        subtitle="A running record of kind moments, focused work and milestones — kept so no praise is ever lost"
      />

      <div className="reveal reveal-d1 mb-5 flex flex-col gap-3 sm:flex-row">
        <select className={`${inputCls} w-full sm:w-56`} value={student} onChange={(e) => setStudent(e.target.value)} aria-label="Filter by student">
          <option value="all">Whole class</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 self-start rounded-xl border border-sand-300 bg-white/70 p-1">
          {(
            [
              { v: "all", l: "Everything" },
              { v: "reward", l: "Rewards" },
              { v: "milestone", l: "Milestones" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setKind(o.v)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition active:scale-95 ${
                kind === o.v ? "bg-sage-600 text-white shadow-sm" : "text-ink-500 hover:bg-sand-100"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
        <p className="self-center text-[12px] font-medium text-ink-400 sm:ml-auto">
          {filtered.length} moment{filtered.length === 1 ? "" : "s"} shown
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="card reveal reveal-d2">
          <EmptyState
            icon="scroll"
            title="No moments recorded here yet"
            hint={
              hasFilters
                ? "Try a different student or switch back to everything."
                : "Tap a reward on the dashboard and it will appear in this journal."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setStudent("all");
                    setKind("all");
                  }}
                >
                  <Icon name="x" className="h-4 w-4" />
                  Clear filters
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g, gi) => (
            <section key={g.label} className={`reveal ${["reveal-d1", "reveal-d2", "reveal-d3"][gi % 3]}`}>
              <h2 className="mb-2 flex items-center gap-3 text-[11px] font-bold tracking-[0.16em] text-ink-400 uppercase">
                {g.label}
                <span className="h-px flex-1 bg-sand-300/60" />
                <span className="font-semibold normal-case tracking-normal">
                  {g.rows.filter((r) => r.kind === "reward").reduce((a, b) => a + b.points, 0)} pts
                </span>
              </h2>
              <ul className="card divide-y divide-sand-200/70">
                {g.rows.map((l) => (
                  <li key={l.id} className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-sage-50/50">
                    {l.kind === "milestone" ? (
                      <span className="breathe flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach-100 text-peach-500">
                        <Icon name="star" className="h-5 w-5" />
                      </span>
                    ) : (
                      <Avatar name={l.studentName ?? "?"} hue={l.studentHue} className="h-10 w-10 text-sm" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-800">
                        {l.kind === "milestone" ? (
                          <>
                            <span className="font-semibold">{l.studentName}</span> — {l.note}
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">{l.studentName}</span> earned{" "}
                            <span className="font-semibold text-sage-700">{l.rewardLabel ?? "a reward"}</span>
                          </>
                        )}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
                        <Icon name="clock" className="h-3.5 w-3.5" />
                        {timeAgo(l.createdAt)}
                      </p>
                    </div>
                    {l.kind === "reward" && l.points > 0 && (
                      <span className="rounded-full bg-sage-100 px-2.5 py-1 font-display text-[13px] font-semibold text-sage-700">
                        +{l.points}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
