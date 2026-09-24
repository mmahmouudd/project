import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  if (!user) redirect("/login");

  return <AppShell user={{ name: user.name, className: user.className }}>{children}</AppShell>;
}
