import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { tierOfPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  const set: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) {
      return Response.json({ error: "A student name is required." }, { status: 400 });
    }
    set.name = name;
  }
  if (body.grade !== undefined) {
    const grade = Number.parseInt(String(body.grade), 10);
    if (!Number.isFinite(grade) || grade < 1 || grade > 6) {
      return Response.json({ error: "Grade must be between 1 and 6." }, { status: 400 });
    }
    set.grade = grade;
  }
  if (body.points !== undefined) {
    const points = Number.parseInt(String(body.points), 10);
    if (!Number.isFinite(points) || points < 0 || points > 9999) {
      return Response.json({ error: "Points must be between 0 and 9999." }, { status: 400 });
    }
    set.points = points;
  }
  if (body.tier !== undefined && ["emerging", "steady", "shining"].includes(String(body.tier))) {
    set.tier = String(body.tier);
  } else if (set.points !== undefined && body.tier === undefined) {
    set.tier = tierOfPoints(Number(set.points));
  }
  if (body.notes !== undefined) {
    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 500) : null;
    set.notes = notes;
  }
  if (body.hue !== undefined) {
    const hue = Number.parseInt(String(body.hue), 10);
    if (Number.isFinite(hue)) set.hue = ((hue % 360) + 360) % 360;
  }

  if (Object.keys(set).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const [row] = await db
    .update(students)
    .set(set)
    .where(eq(students.id, id))
    .returning();
  if (!row) return Response.json({ error: "Student not found." }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const [row] = await db.delete(students).where(eq(students.id, id)).returning();
  if (!row) return Response.json({ error: "Student not found." }, { status: 404 });
  return Response.json({ ok: true });
}
