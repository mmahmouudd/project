import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, rewardTypes, students } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { MILESTONE_STEP, tierOfPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * One-tap micro-reward: records a behavior log, bumps the student's tally
 * and tier, and emits a milestone event when a new 25-point step is crossed.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    studentId?: string;
    rewardTypeId?: string;
  } | null;
  if (!body?.studentId || !body?.rewardTypeId) {
    return Response.json({ error: "studentId and rewardTypeId are required." }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [student] = await tx
        .select()
        .from(students)
        .where(eq(students.id, body.studentId!));
      const [reward] = await tx
        .select()
        .from(rewardTypes)
        .where(eq(rewardTypes.id, body.rewardTypeId!));
      if (!student || !reward) return null;

      const newPoints = student.points + reward.points;
      const prevStep = Math.floor(student.points / MILESTONE_STEP);
      const nextStep = Math.floor(newPoints / MILESTONE_STEP);

      await tx.insert(activityLogs).values({
        studentId: student.id,
        rewardTypeId: reward.id,
        kind: "reward",
        points: reward.points,
        note: reward.label,
      });

      let milestone: string | null = null;
      if (nextStep > prevStep) {
        milestone = `${nextStep * MILESTONE_STEP} points`;
        await tx.insert(activityLogs).values({
          studentId: student.id,
          kind: "milestone",
          points: 0,
          note: `Reached the ${nextStep * MILESTONE_STEP}-point milestone`,
        });
      }

      const [updated] = await tx
        .update(students)
        .set({ points: newPoints, tier: tierOfPoints(newPoints) })
        .where(eq(students.id, student.id))
        .returning();

      return { student: updated, reward, milestone };
    });

    if (!result) {
      return Response.json({ error: "Student or reward not found." }, { status: 404 });
    }
    return Response.json(result);
  } catch (error) {
    console.error("Award failed:", error);
    return Response.json({ error: "Could not record the reward." }, { status: 500 });
  }
}
