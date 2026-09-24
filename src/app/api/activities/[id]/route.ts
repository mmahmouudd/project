import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

const KINDS = ["challenge", "trip", "assignment"];
const STATUSES = ["upcoming", "active", "completed"];

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  const set: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 80) {
      return Response.json({ error: "A title is required." }, { status: 400 });
    }
    set.title = title;
  }
  if (body.kind !== undefined && KINDS.includes(String(body.kind))) set.kind = String(body.kind);
  if (body.status !== undefined && STATUSES.includes(String(body.status))) set.status = String(body.status);
  if (body.points !== undefined) {
    const points = Number.parseInt(String(body.points), 10);
    if (!Number.isFinite(points) || points < 0 || points > 50) {
      return Response.json({ error: "Points must be between 0 and 50." }, { status: 400 });
    }
    set.points = points;
  }
  if (body.description !== undefined) {
    set.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim().slice(0, 400)
        : null;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === "") {
      set.dueDate = null;
    } else {
      const d = new Date(String(body.dueDate));
      if (!Number.isNaN(d.getTime())) set.dueDate = d;
    }
  }

  if (Object.keys(set).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const [row] = await db
    .update(activities)
    .set(set)
    .where(eq(activities.id, id))
    .returning();
  if (!row) return Response.json({ error: "Activity not found." }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const [row] = await db.delete(activities).where(eq(activities.id, id)).returning();
  if (!row) return Response.json({ error: "Activity not found." }, { status: 404 });
  return Response.json({ ok: true });
}
