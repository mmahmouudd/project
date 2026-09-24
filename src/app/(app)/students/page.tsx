"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  Avatar,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Skeleton,
  TierBadge,
  btnGhost,
  btnPrimary,
  iconBtn,
  inputCls,
  useToast,
} from "@/components/ui";
import { MILESTONE_STEP, TIER_META, fmtDate, type Tier } from "@/lib/format";
import type { StudentRow } from "@/lib/types";

const HUES = [18, 45, 90, 150, 190, 258, 300];

interface FormState {
  name: string;
  grade: number;
  tier: Tier;
  points: string;
  notes: string;
  hue: number;
}

const emptyForm: FormState = { name: "", grade: 3, tier: "steady", points: "0", notes: "", hue: 150 };

function StudentForm({
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  initial: FormState;
  busy: boolean;
  onSubmit: (f: FormState) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) {
      setErr("A name is required — the board needs to know who's who.");
      return;
    }
    onSubmit(f);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full name">
        <input
          className={inputCls}
          value={f.name}
          autoFocus
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="e.g. Rosa Meier"
          maxLength={60}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Year">
          <select
            className={inputCls}
            value={f.grade}
            onChange={(e) => setF({ ...f, grade: Number(e.target.value) })}
          >
            {[2, 3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>
                Year {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Behavior tier" hint="auto from points">
          <select
            className={inputCls}
            value={f.tier}
            onChange={(e) => setF({ ...f, tier: e.target.value as Tier })}
          >
            {(Object.keys(TIER_META) as Tier[]).map((t) => (
              <option key={t} value={t}>
                {TIER_META[t].label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Starting points">
          <input
            type="number"
            min={0}
            max={9999}
            className={inputCls}
            value={f.points}
            onChange={(e) => setF({ ...f, points: e.target.value })}
          />
        </Field>
        <Field label="Avatar tone">
          <div className="flex items-center gap-2 pt-1">
            {HUES.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setF({ ...f, hue: h })}
                aria-label={`Tone ${h}`}
                className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-sand-50 transition hover:scale-110 active:scale-95 ${
                  f.hue === h ? "ring-sage-500" : "ring-transparent"
                }`}
                style={{ backgroundColor: `hsl(${h} 38% 72%)` }}
              />
            ))}
          </div>
        </Field>
      </div>
      <Field label="Teacher notes" hint="optional">
        <textarea
          className={`${inputCls} min-h-[76px] resize-y`}
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
          placeholder="How they like to be supported, strengths, gentle reminders…"
          maxLength={500}
        />
      </Field>
      {err && <p className="text-[13px] font-medium text-peach-600">{err}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className={btnGhost} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
          )}
          Save student
        </button>
      </div>
    </form>
  );
}

export default function StudentsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("all");
  const [tier, setTier] = useState("all");
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; row: StudentRow } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("students");
      setRows((await res.json()) as StudentRow[]);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !(r.name.toLowerCase().includes(needle) || (r.notes ?? "").toLowerCase().includes(needle)))
        return false;
      if (grade !== "all" && r.grade !== Number(grade)) return false;
      if (tier !== "all" && r.tier !== tier) return false;
      return true;
    });
  }, [rows, q, grade, tier]);

  const hasFilters = q.trim() !== "" || grade !== "all" || tier !== "all";

  function clearFilters() {
    setQ("");
    setGrade("all");
    setTier("all");
  }

  async function saveStudent(f: FormState) {
    if (!modal) return;
    setBusy(true);

    if (modal.mode === "add") {
      const temp: StudentRow = {
        id: `tmp-${Date.now()}`,
        name: f.name.trim(),
        grade: f.grade,
        tier: f.tier,
        points: Number(f.points) || 0,
        hue: f.hue,
        notes: f.notes.trim() || null,
        enrolledAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      const prev = rows ?? [];
      setRows([temp, ...prev]); // optimistic
      try {
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(temp),
        });
        if (!res.ok) throw new Error("create");
        const saved = (await res.json()) as StudentRow;
        setRows((r) => (r ? r.map((x) => (x.id === temp.id ? saved : x)) : r));
        setModal(null);
        toast(`${saved.name} joined the class board`, "success");
      } catch {
        setRows((r) => (r ? r.filter((x) => x.id !== temp.id) : r)); // rollback
        toast("Couldn't add the student — rolled back", "error");
      } finally {
        setBusy(false);
      }
    } else {
      const target = modal.row;
      const prev = rows ?? [];
      const patch = {
        name: f.name.trim(),
        grade: f.grade,
        tier: f.tier,
        points: Number(f.points) || 0,
        notes: f.notes.trim() || null,
        hue: f.hue,
      };
      // optimistic (tier shown exactly as chosen)
      setRows(prev.map((r) => (r.id === target.id ? { ...r, ...patch } : r)));
      try {
        const res = await fetch(`/api/students/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("update");
        const saved = (await res.json()) as StudentRow;
        setRows((r) => (r ? r.map((x) => (x.id === target.id ? saved : x)) : r));
        setModal(null);
        toast(`${saved.name}'s record is up to date`, "success");
      } catch {
        setRows(prev); // rollback
        toast("Couldn't save changes — rolled back", "error");
      } finally {
        setBusy(false);
      }
    }
  }

  async function removeStudent(row: StudentRow) {
    if (confirmDelete !== row.id) {
      setConfirmDelete(row.id);
      window.setTimeout(() => setConfirmDelete((c) => (c === row.id ? null : c)), 3200);
      return;
    }
    const prev = rows ?? [];
    setRows(prev.filter((r) => r.id !== row.id)); // optimistic
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/students/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete");
      toast(`${row.name} removed from the registry`, "info");
    } catch {
      setRows(prev); // rollback
      toast("Couldn't remove the student — rolled back", "error");
    }
  }

  const loading = rows === null && !error;

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-14 w-64" />
        <Skeleton className="mb-4 h-12" />
        <div className="space-y-2.5">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-[72px]" />
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
          title="Registry couldn't be reached"
          hint="The board lost its connection for a moment."
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
        title="Student Registry"
        subtitle={`${rows!.length} learners on the board · search, filter and keep records gently in touch`}
        actions={
          <button type="button" className={btnPrimary} onClick={() => setModal({ mode: "add" })}>
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
            Add student
          </button>
        }
      />

      {/* Search + filters */}
      <div className="reveal reveal-d1 mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-300" />
          <input
            className={`${inputCls} pl-10`}
            placeholder="Search names or notes — try “hamster” or “kindness”"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-300 transition hover:bg-sand-100 hover:text-ink-600"
              aria-label="Clear search"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <select className={`${inputCls} w-36`} value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="Filter by year">
            <option value="all">All years</option>
            {[2, 3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>
                Year {g}
              </option>
            ))}
          </select>
          <select className={`${inputCls} w-36`} value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Filter by tier">
            <option value="all">All tiers</option>
            {(Object.keys(TIER_META) as Tier[]).map((t) => (
              <option key={t} value={t}>
                {TIER_META[t].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows!.length === 0 ? (
        <div className="card reveal reveal-d2">
          <EmptyState
            icon="users"
            title="The registry is empty"
            hint="Add your first learner and their points, tier and notes will live right here."
            action={
              <button type="button" className={btnPrimary} onClick={() => setModal({ mode: "add" })}>
                <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
                Add your first student
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card reveal reveal-d2">
          <EmptyState
            icon="search"
            title="No students match"
            hint="Try widening the year or tier filters — or a different spelling."
            action={
              <button type="button" className={btnGhost} onClick={clearFilters} disabled={!hasFilters}>
                <Icon name="x" className="h-4 w-4" />
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="card reveal reveal-d2 overflow-hidden">
          {/* Desktop table */}
          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-100/60 text-left text-[11px] font-bold tracking-[0.1em] text-ink-400 uppercase">
                <th className="px-5 py-3">Student</th>
                <th className="px-3 py-3">Year</th>
                <th className="px-3 py-3">Tier</th>
                <th className="px-3 py-3 text-right">Points</th>
                <th className="px-3 py-3 text-right">Milestones</th>
                <th className="px-3 py-3">Enrolled</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200/70">
              {filtered.map((r) => (
                <tr key={r.id} className="group transition hover:bg-sage-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} hue={r.hue} className="h-10 w-10 text-sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">{r.name}</p>
                        {r.notes && <p className="max-w-[300px] truncate text-[11px] text-ink-400">{r.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-ink-700">Year {r.grade}</td>
                  <td className="px-3 py-3">
                    <TierBadge tier={r.tier} />
                  </td>
                  <td className="px-3 py-3 text-right font-display text-[15px] font-semibold text-ink-900">{r.points}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-600">
                      <Icon name="star" className="h-3.5 w-3.5 text-peach-400" />
                      {Math.floor(r.points / MILESTONE_STEP)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-ink-500">{fmtDate(r.enrolledAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button type="button" className={iconBtn} onClick={() => setModal({ mode: "edit", row: r })} aria-label={`Edit ${r.name}`} title="Edit">
                        <Icon name="pencil" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStudent(r)}
                        className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition active:scale-95 ${
                          confirmDelete === r.id
                            ? "bg-peach-500 px-3 text-white hover:bg-peach-600"
                            : `${iconBtn} hover:bg-peach-100 hover:text-peach-600`
                        }`}
                        aria-label={`Remove ${r.name}`}
                        title="Remove"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                        {confirmDelete === r.id && "Confirm"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-sand-200/70 md:hidden">
            {filtered.map((r) => (
              <li key={r.id} className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} hue={r.hue} className="h-10 w-10 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900">{r.name}</p>
                      <TierBadge tier={r.tier} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      Year {r.grade} · {r.points} pts · {Math.floor(r.points / MILESTONE_STEP)} milestones
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className={iconBtn} onClick={() => setModal({ mode: "edit", row: r })} aria-label={`Edit ${r.name}`}>
                      <Icon name="pencil" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStudent(r)}
                      className={`inline-flex h-8 items-center justify-center rounded-lg text-[12px] font-semibold transition active:scale-95 ${
                        confirmDelete === r.id ? "bg-peach-500 px-2.5 text-white" : `${iconBtn} hover:bg-peach-100 hover:text-peach-600`
                      }`}
                      aria-label={`Remove ${r.name}`}
                    >
                      {confirmDelete === r.id ? "Confirm" : <Icon name="trash" className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {r.notes && <p className="mt-2 pl-13 text-[12px] leading-snug text-ink-500">{r.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => (busy ? null : setModal(null))}
        title={modal?.mode === "edit" ? "Edit student" : "Add a student"}
        subtitle={
          modal?.mode === "edit"
            ? "Changes save straight to the class board."
            : "They'll appear on the reward board the moment you save."
        }
      >
        {modal && (
          <StudentForm
            key={modal.mode === "edit" ? modal.row.id : "add"}
            initial={
              modal.mode === "edit"
                ? {
                    name: modal.row.name,
                    grade: modal.row.grade,
                    tier: modal.row.tier,
                    points: String(modal.row.points),
                    notes: modal.row.notes ?? "",
                    hue: modal.row.hue,
                  }
                : emptyForm
            }
            busy={busy}
            onSubmit={saveStudent}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
