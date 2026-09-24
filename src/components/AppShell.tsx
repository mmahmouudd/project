"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { Avatar, ToastProvider } from "@/components/ui";

const NAV: { href: string; label: string; icon: IconName; note: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", note: "Live class pulse" },
  { href: "/students", label: "Student Registry", icon: "users", note: "Profiles & tiers" },
  { href: "/activities", label: "Activities & Rewards", icon: "flag", note: "Challenges, trips, tasks" },
  { href: "/log", label: "Behavior Log", icon: "scroll", note: "Every moment, kept" },
];

function Brand() {
  return (
    <Link href="/dashboard" className="group flex items-center gap-3 px-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-600 text-white shadow-sm transition group-hover:bg-sage-700">
        <Icon name="leaf" className="h-5.5 w-5.5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg text-ink-900">Willow Lane</span>
        <span className="block text-[11px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
          Classroom Hub
        </span>
      </span>
    </Link>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
              active
                ? "bg-sage-100/90 text-sage-800"
                : "text-ink-500 hover:bg-sand-100 hover:text-ink-800"
            }`}
          >
            <span
              className={`absolute left-0 h-5 w-1 rounded-r-full bg-sage-500 transition-all duration-300 ${
                active ? "opacity-100" : "opacity-0 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-40"
              }`}
            />
            <Icon name={item.icon} className="h-5 w-5" strokeWidth={active ? 2 : 1.7} />
            <span className="flex flex-col">
              <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
              <span className={`text-[11px] ${active ? "text-sage-600" : "text-ink-400"}`}>{item.note}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserBlock({ name, className }: { name: string; className: string }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="mt-auto rounded-xl border border-sand-200 bg-white/60 p-3">
      <div className="flex items-center gap-3">
        <Avatar name={name} hue={152} className="h-9 w-9 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-800">{name}</p>
          <p className="truncate text-[11px] text-ink-400">{className}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-peach-100 hover:text-peach-600 active:scale-90"
          title="Sign out"
          aria-label="Sign out"
        >
          <Icon name="logout" className="h-4.5 w-4.5" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-sand-200 pt-2.5 text-[11px] font-medium text-ink-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
        </span>
        Smartboard session · 30 days
      </div>
    </div>
  );
}

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; className: string };
}) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const current = NAV.find((n) => pathname === n.href);

  return (
    <ToastProvider>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-sand-200 bg-sand-50/80 px-4 py-6 backdrop-blur-sm lg:flex">
        <Brand />
        <NavItems />
        <div className="mt-6 hidden rounded-xl bg-sage-800 p-4 text-sage-50 xl:block">
          <p className="font-display text-[15px] leading-snug">“Calm rooms make brave learners.”</p>
          <p className="mt-2 text-[11px] text-sage-200/80">— pinned on the classroom wall</p>
        </div>
        <UserBlock name={user.name} className={user.className} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-sand-200 bg-sand-50/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-sand-300 bg-white/70 text-ink-700 transition active:scale-95"
          aria-label="Open menu"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600 text-white">
            <Icon name="leaf" className="h-4 w-4" />
          </span>
          <span className="font-display text-lg text-ink-900">Willow Lane</span>
        </div>
        <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-sage-700">
          {current?.label ?? "Hub"}
        </span>
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
            onClick={() => setDrawer(false)}
          />
          <div className="pop-in absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-sand-200 bg-sand-50 px-4 py-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition hover:bg-sand-100 active:scale-90"
                aria-label="Close menu"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setDrawer(false)} />
            <UserBlock name={user.name} className={user.className} />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="min-h-screen lg:pl-[264px]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </ToastProvider>
  );
}
