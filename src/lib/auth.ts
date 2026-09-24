import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

export const SESSION_COOKIE = "willow_session";
export const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(8).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 32).toString("hex");
  const a = createHash("sha256").update(hash).digest();
  const b = createHash("sha256").update(test).digest();
  return timingSafeEqual(a, b);
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ userId, token, expiresAt, device: "smartboard" });
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function cleanExpiredSessions(userId: string): Promise<void> {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lte(sessions.expiresAt, new Date())));
}

export async function touchSession(token: string): Promise<void> {
  const threshold = new Date(Date.now() - 5 * 60_000);
  await db
    .update(sessions)
    .set({ lastActiveAt: new Date() })
    .where(and(eq(sessions.token, token), lte(sessions.lastActiveAt, threshold)));
}

/** Resolves the currently authenticated user from the persistent smartboard session cookie. */
export async function requireUser(): Promise<User | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    if (!session || session.expiresAt.getTime() < Date.now()) return null;
    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!user) return null;
    void touchSession(token);
    return user;
  } catch {
    return null;
  }
}
