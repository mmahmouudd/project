import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { LoginForm } from "@/components/LoginForm";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureSeeded();
  const store = await cookies();
  if (store.get(SESSION_COOKIE)?.value) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-sage-800 p-10 text-sand-50 lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(36rem 26rem at 88% -8%, rgb(239 178 140 / 0.28), transparent 60%), radial-gradient(30rem 24rem at -6% 104%, rgb(130 160 120 / 0.35), transparent 60%)",
          }}
        />
        {/* Faint leaf line-art */}
        <svg
          className="pointer-events-none absolute -right-16 -bottom-16 h-[420px] w-[420px] text-sand-50/[0.07]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        >
          <path d="M5 21c0-9.5 5.5-15 14.5-16.5C19.5 14 14 19.5 5 21z" />
          <path d="M5 21c2.5-6.5 6.5-11.5 11.5-14.5" />
          <circle cx="12" cy="12" r="11" strokeDasharray="1.5 3" />
        </svg>

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand-50/10 ring-1 ring-sand-50/25">
            <Icon name="leaf" className="h-6 w-6 text-peach-200" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-xl">Willow Lane</p>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-sand-50/60 uppercase">
              Classroom Hub
            </p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-display text-[2.9rem] leading-[1.08] tracking-tight xl:text-5xl">
            A calm, steady place to run a busy morning.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-sand-50/75">
            One tap on the board acknowledges a kind moment. The tallies, milestones and
            behavior logs keep themselves — so you can stay present with the class.
          </p>

          <div className="mt-9 grid grid-cols-3 gap-3">
            {[
              { v: "12", l: "learners on the board", icon: "users" as const },
              { v: "540", l: "gentle points this term", icon: "sparkle" as const },
              { v: "24", l: "milestones reached", icon: "award" as const },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl bg-sand-50/[0.07] p-3.5 ring-1 ring-sand-50/15"
              >
                <div className="flex items-center gap-1.5 text-peach-200">
                  <Icon name={s.icon} className="h-4 w-4" />
                  <span className="font-display text-2xl text-sand-50">{s.v}</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-sand-50/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-sand-50/45">
          Willow Lane Primary · Years 2–4 · Smartboard 01
        </p>
      </div>

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-10">
        <div className="reveal w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-600 text-white">
              <Icon name="leaf" className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg text-ink-900">Willow Lane</p>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-ink-400 uppercase">
                Classroom Hub
              </p>
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
