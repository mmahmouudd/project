"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { Field, inputCls, btnPrimary } from "@/components/ui";
import { Icon } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed. Please try again.");
        setBusy(false);
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("The smartboard couldn't be reached. Try again in a moment.");
      setBusy(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-7 sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-sage-600 uppercase">Smartboard sign-in</p>
        <h1 className="mt-2 font-display text-3xl text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Your class is where you left it — tallies, logs and all.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@school.org"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-peach-200 bg-peach-50 px-3.5 py-2.5 text-[13px] font-medium text-peach-600">
              <Icon name="x" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Waking the board…
              </>
            ) : (
              <>
                Enter the classroom
                <Icon name="arrowRight" className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-sand-300 bg-sand-100/70 px-4 py-3">
        <div className="min-w-0 text-[12px] leading-snug text-ink-500">
          <p className="font-semibold text-ink-700">Demo session</p>
          <p className="truncate">
            {DEMO_EMAIL} · {DEMO_PASSWORD}
          </p>
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="shrink-0 rounded-lg border border-sage-300 bg-sage-50 px-3 py-1.5 text-[12px] font-semibold text-sage-700 transition hover:bg-sage-100 active:scale-95"
        >
          Fill for me
        </button>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-400">
        <Icon name="shield" className="h-3.5 w-3.5" />
        Sessions persist on this smartboard for 30 days.
      </p>
    </div>
  );
}
