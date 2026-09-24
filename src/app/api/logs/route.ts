import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, rewardTypes, students } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });
  await ensureSeeded();

  const sp = new URL(req.url).searchParams;
  const limit = Math.min(Number.parseInt(sp.get("limit") ?? "80", 10) || 80, 200);

  const rows = await db
    .select({
      id: activityLogs.id,
      kind: activityLogs.kind,
      points: activityLogs.points,
      note: activityLogs.note,
      createdAt: activityLogs.createdAt,
      studentId: activityLogs.studentId,
      studentName: students.name,
      studentHue: students.hue,
      rewardLabel: rewardTypes.label,
    })
    .from(activityLogs)
    .innerJoin(students, eq(activityLogs.studentId, students.id))
    .leftJoin(rewardTypes, eq(activityLogs.rewardTypeId, rewardTypes.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  return Response.json(
    rows.map((r) => ({
      ...r,
      kind: r.kind === "milestone" ? "milestone" : "reward",
      createdAt: r.createdAt.toISOString(),
    })),
  );
}
