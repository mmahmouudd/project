import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });
  await ensureSeeded();

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const kind = sp.get("kind");
  const status = sp.get("status");

  const conds = [];
  if (q) {
    conds.push(
      or(ilike(activities.title, `%${q}%`), ilike(activities.description, `%${q}%`)),
    );
  }
  if (kind && ["challenge", "trip", "assignment"].includes(kind)) {
    conds.push(eq(activities.kind, kind));
  }
  if (status && ["upcoming", "active", "completed"].includes(status)) {
    conds.push(eq(activities.status, status));
  }

  const rows = await db
    .select()
    .from(activities)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(activities.createdAt));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 80) {
    return Response.json({ error: "A title is required (max 80 characters)." }, { status: 400 });
  }
  const kind = ["challenge", "trip", "assignment"].includes(String(body.kind)) ? String(body.kind) : "challenge";
  const points = Math.max(0, Math.min(Number.parseInt(String(body.points ?? 5), 10) || 0, 50));
  const status = ["upcoming", "active", "completed"].includes(String(body.status)) ? String(body.status) : "upcoming";
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim().slice(0, 400)
      : null;
  let dueDate: Date | null = null;
  if (typeof body.dueDate === "string" && body.dueDate) {
    const d = new Date(body.dueDate);
    if (!Number.isNaN(d.getTime())) dueDate = d;
  }

  const [row] = await db
    .insert(activities)
    .values({ title, kind, description, points, status, dueDate })
    .returning();
  return Response.json(row, { status: 201 });
}
