import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = await cookies();
  if (store.get(SESSION_COOKIE)?.value) redirect("/dashboard");
  redirect("/login");
}
