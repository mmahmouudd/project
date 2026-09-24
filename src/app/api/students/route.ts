import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { tierOfPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });
  await ensureSeeded();

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const grade = sp.get("grade");
  const tier = sp.get("tier");

  const conds = [];
  if (q) {
    conds.push(or(ilike(students.name, `%${q}%`), ilike(students.notes, `%${q}%`)));
  }
  if (grade && grade !== "all") {
    const g = Number.parseInt(grade, 10);
    if (Number.isFinite(g)) conds.push(eq(students.grade, g));
  }
  if (tier && tier !== "all" && ["emerging", "steady", "shining"].includes(tier)) {
    conds.push(eq(students.tier, tier));
  }

  const rows = await db
    .select()
    .from(students)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(students.name));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    return Response.json({ error: "A student name is required (max 60 characters)." }, { status: 400 });
  }
  const grade = Number.parseInt(String(body.grade ?? 3), 10);
  if (!Number.isFinite(grade) || grade < 1 || grade > 6) {
    return Response.json({ error: "Grade must be between 1 and 6." }, { status: 400 });
  }
  const tier = typeof body.tier === "string" && ["emerging", "steady", "shining"].includes(body.tier) ? body.tier : null;
  const pointsRaw = Number.parseInt(String(body.points ?? 0), 10);
  const points = Number.isFinite(pointsRaw) ? Math.max(0, Math.min(pointsRaw, 9999)) : 0;
  const hueRaw = Number.parseInt(String(body.hue ?? 150), 10);
  const hue = Number.isFinite(hueRaw) ? ((hueRaw % 360) + 360) % 360 : 150;
  const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 500) : null;

  const [row] = await db
    .insert(students)
    .values({
      name,
      grade,
      points,
      tier: tier ?? tierOfPoints(points),
      hue,
      notes,
      enrolledAt: new Date(),
    })
    .returning();

  return Response.json(row, { status: 201 });
}
