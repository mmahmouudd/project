import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  SESSION_COOKIE,
  cleanExpiredSessions,
  createSession,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureSeeded();

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return Response.json(
      { error: "Enter both your email and password." },
      { status: 400 },
    );
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json(
      { error: "That email and password don't match. The demo session below works." },
      { status: 401 },
    );
  }

  await cleanExpiredSessions(user.id);
  const { token, expiresAt } = await createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: expiresAt,
  });

  return Response.json({
    user: { id: user.id, name: user.name, email: user.email, className: user.className },
  });
}
