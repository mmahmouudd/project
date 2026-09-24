"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Skeleton,
  btnGhost,
  btnPrimary,
  iconBtn,
  inputCls,
  useToast,
} from "@/components/ui";
import {
  KIND_META,
  STATUS_META,
  fmtDay,
  type ActivityKind,
  type ActivityStatus,
} from "@/lib/format";
import type { ActivityRow } from "@/lib/types";

const KIND_TABS: { value: "all" | ActivityKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "challenge", label: "Challenges" },
  { value: "trip", label: "Trips" },
  { value: "assignment", label: "Assignments" },
];

const NEXT_STATUS: Partial<Record<ActivityStatus, { to: ActivityStatus; label: string }>> = {
  upcoming: { to: "active", label: "Start" },
  active: { to: "completed", label: "Complete" },
};

interface FormState {
  title: string;
  kind: ActivityKind;
  points: string;
  status: ActivityStatus;
  dueDate: string; // yyyy-mm-dd or ""
  description: string;
}

const emptyForm: FormState = {
  title: "",
  kind: "challenge",
  points: "5",
  status: "upcoming",
  dueDate: "",
  description: "",
};

function toInputDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function ActivityForm({
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
    if (!f.title.trim()) {
      setErr("Give it a title the class will recognise.");
      return;
    }
    onSubmit(f);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Title">
        <input
          className={inputCls}
          value={f.title}
          autoFocus
          maxLength={80}
          onChange={(e) => setF({ ...f, title: e.target.value })}
          placeholder="e.g. Kindness Chain"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type">
          <select
            className={inputCls}
            value={f.kind}
            onChange={(e) => setF({ ...f, kind: e.target.value as ActivityKind })}
          >
            {(Object.keys(KIND_META) as ActivityKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_META[k].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Point weighting" hint="0–50 pts">
          <input
            type="number"
            min={0}
            max={50}
            className={inputCls}
            value={f.points}
            onChange={(e) => setF({ ...f, points: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <select
            className={inputCls}
            value={f.status}
            onChange={(e) => setF({ ...f, status: e.target.value as ActivityStatus })}
          >
            {(Object.keys(STATUS_META) as ActivityStatus[]).map((st) => (
              <option key={st} value={st}>
                {STATUS_META[st].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due date" hint="optional">
          <input
            type="date"
            className={inputCls}
            value={f.dueDate}
            onChange={(e) => setF({ ...f, dueDate: e.target.value })}
          />
        </Field>
      </div>
      <Field label="What the class does" hint="optional">
        <textarea
          className={`${inputCls} min-h-[84px] resize-y`}
          maxLength={400}
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          placeholder="A sentence or two is plenty — it shows on the card and in the plan."
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
          Save activity
        </button>
      </div>
    </form>
  );
}

export default function ActivitiesPage() {
  const toast = useToast();
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"all" | ActivityKind>("all");
  const [status, setStatus] = useState<"all" | ActivityStatus>("all");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; row: ActivityRow } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/activities");
      if (!res.ok) throw new Error("activities");
      setRows((await res.json()) as ActivityRow[]);
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
    const order: Record<ActivityStatus, number> = { active: 0, upcoming: 1, completed: 2 };
    return rows
      .filter((r) => {
        if (tab !== "all" && r.kind !== tab) return false;
        if (status !== "all" && r.status !== status) return false;
        if (needle && !`${r.title} ${r.description ?? ""}`.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          order[a.status] - order[b.status] ||
          (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
            (b.dueDate ? new Date(b.dueDate).getTime() : Infinity),
      );
  }, [rows, tab, status, q]);

  function bodyFrom(f: FormState) {
    return {
      title: f.title.trim(),
      kind: f.kind,
      points: Number(f.points) || 0,
      status: f.status,
      description: f.description.trim() || null,
      dueDate: f.dueDate ? new Date(`${f.dueDate}T15:00:00`).toISOString() : null,
    };
  }

  async function saveActivity(f: FormState) {
    if (!modal) return;
    setBusy(true);
    const payload = bodyFrom(f);

    if (modal.mode === "add") {
      const temp: ActivityRow = {
        id: `tmp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      const prev = rows ?? [];
      setRows([temp, ...prev]); // optimistic
      try {
        const res = await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(temp),
        });
        if (!res.ok) throw new Error("create");
        const saved = (await res.json()) as ActivityRow;
        setRows((r) => (r ? r.map((x) => (x.id === temp.id ? saved : x)) : r));
        setModal(null);
        toast(`“${saved.title}” is on the board`, "success");
      } catch {
        setRows((r) => (r ? r.filter((x) => x.id !== temp.id) : r)); // rollback
        toast("Couldn't add the activity — rolled back", "error");
      } finally {
        setBusy(false);
      }
    } else {
      const target = modal.row;
      const prev = rows ?? [];
      setRows(prev.map((r) => (r.id === target.id ? { ...r, ...payload } : r))); // optimistic
      try {
        const res = await fetch(`/api/activities/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("update");
        const saved = (await res.json()) as ActivityRow;
        setRows((r) => (r ? r.map((x) => (x.id === target.id ? saved : x)) : r));
        setModal(null);
        toast(`“${saved.title}” updated`, "success");
      } catch {
        setRows(prev); // rollback
        toast("Couldn't save changes — rolled back", "error");
      } finally {
        setBusy(false);
      }
    }
  }

  /** Quick one-tap status progression, also optimistic. */
  async function progress(row: ActivityRow) {
    const next = NEXT_STATUS[row.status];
    if (!next) return;
    const prev = rows ?? [];
    setRows(prev.map((r) => (r.id === row.id ? { ...r, status: next.to } : r))); // optimistic
    try {
      const res = await fetch(`/api/activities/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next.to }),
      });
      if (!res.ok) throw new Error("progress");
      const saved = (await res.json()) as ActivityRow;
      setRows((r) => (r ? r.map((x) => (x.id === row.id ? saved : x)) : r));
      toast(
        next.to === "completed" ? `“${row.title}” wrapped up nicely` : `“${row.title}” is now active`,
        "success",
      );
    } catch {
      setRows(prev); // rollback
      toast("Couldn't update status — rolled back", "error");
    }
  }

  async function remove(row: ActivityRow) {
    if (confirmDelete !== row.id) {
      setConfirmDelete(row.id);
      window.setTimeout(() => setConfirmDelete((c) => (c === row.id ? null : c)), 3200);
      return;
    }
    const prev = rows ?? [];
    setRows(prev.filter((r) => r.id !== row.id)); // optimistic
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/activities/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete");
      toast(`“${row.title}” removed`, "info");
    } catch {
      setRows(prev); // rollback
      toast("Couldn't remove it — rolled back", "error");
    }
  }

  const loading = rows === null && !error;

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-14 w-72" />
        <Skeleton className="mb-4 h-11 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[190px]" />
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
          title="The hub couldn't be reached"
          hint="Give it another tap — your activities are safe."
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
        title="Activities & Rewards Hub"
        subtitle="Challenges, trips and assignments — every one carries a point weighting that lands straight on student tallies"
        actions={
          <button type="button" className={btnPrimary} onClick={() => setModal({ mode: "add" })}>
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
            New activity
          </button>
        }
      />

      {/* Kind tabs */}
      <div className="reveal reveal-d1 mb-3 inline-flex flex-wrap gap-1 rounded-xl border border-sand-300 bg-white/70 p-1">
        {KIND_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition active:scale-95 ${
              tab === t.value ? "bg-sage-600 text-white shadow-sm" : "text-ink-500 hover:bg-sand-100 hover:text-ink-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="reveal reveal-d2 mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-300" />
          <input
            className={`${inputCls} pl-10`}
            placeholder="Search activities…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={`${inputCls} w-40`}
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | ActivityStatus)}
          aria-label="Filter by status"
        >
          <option value="all">Any status</option>
          {(Object.keys(STATUS_META) as ActivityStatus[]).map((st) => (
            <option key={st} value={st}>
              {STATUS_META[st].label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card reveal reveal-d3">
          <EmptyState
            icon="flag"
            title={rows!.length === 0 ? "Nothing on the board yet" : "No activities match"}
            hint={
              rows!.length === 0
                ? "Start a kindness challenge, plan a trip, or drop in a short assignment."
                : "Widen the type tabs or status filter to see more."
            }
            action={
              rows!.length === 0 ? (
                <button type="button" className={btnPrimary} onClick={() => setModal({ mode: "add" })}>
                  <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
                  Create the first activity
                </button>
              ) : (
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setTab("all");
                    setStatus("all");
                    setQ("");
                  }}
                >
                  <Icon name="x" className="h-4 w-4" />
                  Clear filters
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r, i) => {
            const kind = KIND_META[r.kind];
            const st = STATUS_META[r.status];
            const next = NEXT_STATUS[r.status];
            return (
              <article
                key={r.id}
                className={`card reveal group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-(--shadow-lift) ${
                  i % 3 === 0 ? "reveal-d2" : i % 3 === 1 ? "reveal-d3" : "reveal-d4"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${kind.chip}`}>
                    <Icon name={kind.icon as never} className="h-3.5 w-3.5" />
                    {kind.label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-lg leading-snug text-ink-900">{r.title}</h3>
                {r.description && (
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-500">{r.description}</p>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-sand-200 pt-3.5 text-[11px] font-medium text-ink-400">
                  <span className="inline-flex items-center gap-1 rounded-full bg-peach-100 px-2.5 py-1 text-[11px] font-bold text-peach-600">
                    <Icon name="sparkle" className="h-3.5 w-3.5" />
                    +{r.points} pts
                  </span>
                  {r.dueDate && (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="calendar" className="h-3.5 w-3.5" />
                      {fmtDay(r.dueDate)}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    {next && (
                      <button
                        type="button"
                        onClick={() => progress(r)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-sage-300 bg-sage-50 px-2.5 text-[12px] font-semibold text-sage-700 transition hover:bg-sage-100 active:scale-95"
                      >
                        <Icon name={next.to === "completed" ? "check" : "sun"} className="h-3.5 w-3.5" />
                        {next.label}
                      </button>
                    )}
                    <button type="button" className={iconBtn} onClick={() => setModal({ mode: "edit", row: r })} aria-label={`Edit ${r.title}`} title="Edit">
                      <Icon name="pencil" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r)}
                      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition active:scale-95 ${
                        confirmDelete === r.id
                          ? "bg-peach-500 px-2.5 text-white hover:bg-peach-600"
                          : `${iconBtn} hover:bg-peach-100 hover:text-peach-600`
                      }`}
                      aria-label={`Remove ${r.title}`}
                      title="Remove"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                      {confirmDelete === r.id && "Confirm"}
                    </button>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => (busy ? null : setModal(null))}
        title={modal?.mode === "edit" ? "Edit activity" : "New activity"}
        subtitle="Point weighting decides how much it's worth when a learner finishes it."
      >
        {modal && (
          <ActivityForm
            key={modal.mode === "edit" ? modal.row.id : "add"}
            initial={
              modal.mode === "edit"
                ? {
                    title: modal.row.title,
                    kind: modal.row.kind,
                    points: String(modal.row.points),
                    status: modal.row.status,
                    dueDate: toInputDate(modal.row.dueDate),
                    description: modal.row.description ?? "",
                  }
                : emptyForm
            }
            busy={busy}
            onSubmit={saveActivity}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
