"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initials, TIER_META, type Tier } from "@/lib/format";
import { Icon, type IconName } from "@/components/icons";

/* ---------------- Avatar ---------------- */

export function Avatar({
  name,
  hue,
  className = "h-10 w-10 text-sm",
}: {
  name: string;
  hue: number;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold select-none ring-1 ring-black/5 ${className}`}
      style={{
        backgroundColor: `hsl(${hue} 38% 86%)`,
        color: `hsl(${hue} 42% 30%)`,
      }}
    >
      {initials(name)}
    </div>
  );
}

/* ---------------- Tier badge ---------------- */

export function TierBadge({ tier, className = "" }: { tier: Tier; className?: string }) {
  const meta = TIER_META[tier] ?? TIER_META.steady;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${meta.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/* ---------------- Skeleton ---------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/* ---------------- Empty state ---------------- */

export function EmptyState({
  icon = "leaf",
  title,
  hint,
  action,
}: {
  icon?: IconName;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-100 text-sage-600">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <p className="mt-4 font-display text-lg text-ink-800">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-ink-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="pop-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-sand-200 bg-sand-50 shadow-(--shadow-lift) sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-sand-200 px-6 py-4">
          <div>
            <h2 className="font-display text-xl text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-sand-100 hover:text-ink-700 active:scale-95"
            aria-label="Close"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Form primitives ---------------- */

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold text-ink-700">
        {label}
        {hint && <span className="text-[11px] font-medium text-ink-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-sand-300 bg-white/80 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-sage-400 focus:ring-2 focus:ring-sage-200 focus:outline-none";

/* ---------------- Buttons ---------------- */

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-sand-300 bg-white/70 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-sand-100 active:scale-[0.97] disabled:opacity-50";

export const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-sand-100 hover:text-ink-700 active:scale-90";

/* ---------------- Toasts ---------------- */

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastCtx = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

const TONE_STYLES: Record<ToastTone, { box: string; icon: IconName; iconCls: string }> = {
  success: { box: "border-sage-200 bg-sage-50 text-sage-800", icon: "check", iconCls: "bg-sage-600 text-white" },
  error: { box: "border-peach-200 bg-peach-50 text-peach-600", icon: "x", iconCls: "bg-peach-500 text-white" },
  info: { box: "border-sand-300 bg-white text-ink-700", icon: "sparkle", iconCls: "bg-ink-500 text-white" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++counter.current;
    setToasts((t) => [...t.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const s = TONE_STYLES[t.tone];
          return (
            <div
              key={t.id}
              className={`toast-enter pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-(--shadow-lift) ${s.box}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.iconCls}`}>
                <Icon name={s.icon} className="h-3.5 w-3.5" strokeWidth={2.4} />
              </span>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Page header ---------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
  delay = "",
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  delay?: string;
}) {
  return (
    <div className={`reveal ${delay} mb-6 flex flex-wrap items-end justify-between gap-4`}>
      <div>
        <h1 className="font-display text-3xl tracking-tight text-ink-900">{title}</h1>
        <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
