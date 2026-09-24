import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLogs,
  activities,
  rewardTypes,
  students,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { tierOfPoints } from "@/lib/format";

import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

export { DEMO_EMAIL, DEMO_PASSWORD };

/** Deterministic PRNG so the seeded week of activity is stable between runs. */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RosterEntry {
  name: string;
  grade: number;
  points: number;
  hue: number;
  notes: string;
  monthsIn: number;
}

const ROSTER: RosterEntry[] = [
  { name: "Amara Okafor", grade: 3, points: 48, hue: 24, notes: "Loves nature writing. Prefers the quiet reading corner.", monthsIn: 8 },
  { name: "Theo Lindqvist", grade: 3, points: 132, hue: 152, notes: "Kindness-chain champion. Cares for the class plants.", monthsIn: 11 },
  { name: "Priya Sharma", grade: 4, points: 57, hue: 338, notes: "Rises to math challenges. Shares her thinking carefully.", monthsIn: 6 },
  { name: "Mateo Rossi", grade: 2, points: 41, hue: 18, notes: "New to Willow Lane — settling in nicely this term.", monthsIn: 3 },
  { name: "Freya Nilsen", grade: 3, points: 118, hue: 192, notes: "First reader. Loves reading aloud to the Year 2s.", monthsIn: 9 },
  { name: "Jonah Park", grade: 4, points: 44, hue: 44, notes: "Great in group work. A gentle nudge helps with tidy-up.", monthsIn: 7 },
  { name: "Sofia Almeida", grade: 3, points: 52, hue: 298, notes: "Gentle with the class hamster. Maps and globes, always.", monthsIn: 10 },
  { name: "Felix Braun", grade: 2, points: 18, hue: 122, notes: "Building steady focus. Responds well to the quiet signal.", monthsIn: 5 },
  { name: "Nadia Hassan", grade: 4, points: 62, hue: 258, notes: "Peer reader for Jonah. Strong, calm problem solver.", monthsIn: 8 },
  { name: "Oscar Whitfield", grade: 3, points: 140, hue: 82, notes: "Garden captain. Always finds a way to help a friend.", monthsIn: 12 },
  { name: "Isla McKay", grade: 2, points: 12, hue: 176, notes: "Joined in September. Warming up to group circles.", monthsIn: 2 },
  { name: "Leo Tanaka", grade: 4, points: 34, hue: 8, notes: "Quiet and observant. Really shines in art time.", monthsIn: 4 },
];

const DAY = 86_400_000;

/** Students guaranteed to have a log entry earlier today → live "engaged today" stat. */
const FORCED_TODAY = new Set([1, 4, 6, 9]);

export async function ensureSeeded(): Promise<void> {
  try {
    const [{ c }] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(users);
    if (c > 0) return;

    const rand = mulberry32(20260214);
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    await db.insert(users).values({
      name: "Juniper Hale",
      email: DEMO_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
      className: "Willow Lane · Years 2–4",
    });

    const rewardDefs = [
      { label: "Kind Words", points: 1, tone: "peach", icon: "chat", peer: true, sortOrder: 1 },
      { label: "Focus & Care", points: 2, tone: "sage", icon: "leaf", peer: false, sortOrder: 2 },
      { label: "Helping Hand", points: 2, tone: "sage", icon: "heart", peer: true, sortOrder: 3 },
      { label: "Great Share", points: 2, tone: "peach", icon: "sun", peer: true, sortOrder: 4 },
      { label: "Tidy Corner", points: 1, tone: "sand", icon: "sparkle", peer: false, sortOrder: 5 },
    ];
    const rewards = await db.insert(rewardTypes).values(rewardDefs).returning();

    const roster = await db
      .insert(students)
      .values(
        ROSTER.map((s) => ({
          name: s.name,
          grade: s.grade,
          points: s.points,
          tier: tierOfPoints(s.points),
          hue: s.hue,
          notes: s.notes,
          enrolledAt: new Date(now - s.monthsIn * 30 * DAY),
          createdAt: new Date(now - 12 * DAY),
        })),
      )
      .returning();

    const activityDefs = [
      { title: "Kindness Chain", kind: "challenge", description: "Every act of kindness adds a name tag to the classroom chain. Longest unbroken week wins the class plant.", points: 5, status: "active", offset: 3 },
      { title: "Weather Journal", kind: "assignment", description: "Record the sky, the wind and one cloud you can name in your journal.", points: 4, status: "active", offset: 1 },
      { title: "Fraction Kitchen", kind: "assignment", description: "Recipe cards in halves and quarters — measure, mix, share evenly.", points: 6, status: "active", offset: 2 },
      { title: "Class Pet Care", kind: "challenge", description: "Rotating caretakers for Hamish the hamster. Feed, water, tell him one kind thing.", points: 4, status: "active", offset: 4 },
      { title: "Reading Garden", kind: "challenge", description: "Read one book a week and plant a seed in the class garden for each.", points: 5, status: "upcoming", offset: 6 },
      { title: "Museum of Light", kind: "trip", description: "Half-day visit. Bring the sketchbook and the good pencil.", points: 10, status: "upcoming", offset: 12 },
      { title: "School Garden Day", kind: "trip", description: "On-site harvest with the Year 5s. Wellies and gloves required.", points: 8, status: "upcoming", offset: 18 },
      { title: "Kindness Bingo", kind: "challenge", description: "A gentle card of kind acts — complete a line before Friday.", points: 3, status: "completed", offset: -2 },
    ];
    await db.insert(activities).values(
      activityDefs.map((a) => ({
        title: a.title,
        kind: a.kind,
        description: a.description,
        points: a.points,
        status: a.status,
        dueDate: new Date(now + a.offset * DAY),
        createdAt: new Date(now - (10 - a.offset) * DAY),
      })),
    );

    const logs: {
      studentId: string;
      rewardTypeId: string | null;
      kind: "reward" | "milestone";
      points: number;
      note: string | null;
      createdAt: Date;
    }[] = [];

    roster.forEach((student, i) => {
      const target = ROSTER[i].points;
      let remaining = target;
      const entries: { reward: (typeof rewards)[number]; pts: number }[] = [];
      while (remaining > 0) {
        const pool = remaining >= 2 ? rewards : rewards.filter((r) => r.points === 1);
        const reward = pool[Math.floor(rand() * pool.length)];
        const pts = Math.min(reward.points, remaining);
        entries.push({ reward, pts });
        remaining -= pts;
      }

      entries.forEach((entry, j) => {
        let ts: number;
        if (FORCED_TODAY.has(i) && j === 0) {
          ts = Math.min(
            startOfToday + Math.floor(rand() * 4.5 * 3_600_000),
            now - 4 * 60_000,
          );
        } else {
          const dayOffset = rand() < 0.32 ? 0 : Math.floor(rand() * 7);
          ts = now - dayOffset * DAY - Math.floor(rand() * 0.55 * DAY);
        }
        logs.push({
          studentId: student.id,
          rewardTypeId: entry.reward.id,
          kind: "reward",
          points: entry.pts,
          note: entry.reward.label,
          createdAt: new Date(ts),
        });
      });

      const milestones = Math.floor(target / 25);
      for (let k = 1; k <= milestones; k++) {
        const spread = milestones === 1 ? 5.5 : 6 - (5.5 * (k - 1)) / (milestones - 1);
        const ts = now - spread * DAY - Math.floor(rand() * 6 * 3_600_000);
        logs.push({
          studentId: student.id,
          rewardTypeId: null,
          kind: "milestone",
          points: 0,
          note: `Reached the ${k * 25}-point milestone`,
          createdAt: new Date(ts),
        });
      }
    });

    logs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    await db.insert(activityLogs).values(logs);

    // A fresh "today" ping from the garden captain so the board opens alive.
    const freshReward = rewards.find((r) => r.icon === "heart") ?? rewards[0];
    await db.insert(activityLogs).values({
      studentId: roster[9].id,
      rewardTypeId: freshReward.id,
      kind: "reward",
      points: freshReward.points,
      note: freshReward.label,
      createdAt: new Date(now - 26 * 60_000),
    });
  } catch (error) {
    // Never block the app on a failed seed; first request will retry.
    console.error("Seed failed:", error);
  }
}
