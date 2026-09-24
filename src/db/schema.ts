import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  className: text("class_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  device: text("device").notNull().default("smartboard"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  grade: integer("grade").notNull().default(3),
  tier: text("tier").notNull().default("steady"),
  points: integer("points").notNull().default(0),
  hue: integer("hue").notNull().default(150),
  notes: text("notes"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rewardTypes = pgTable("reward_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  points: integer("points").notNull().default(1),
  tone: text("tone").notNull().default("sage"),
  icon: text("icon").notNull().default("leaf"),
  peer: boolean("peer").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("challenge"),
  description: text("description"),
  points: integer("points").notNull().default(5),
  status: text("status").notNull().default("upcoming"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").references(() => students.id, {
      onDelete: "cascade",
    }),
    activityId: uuid("activity_id").references(() => activities.id, {
      onDelete: "set null",
    }),
    rewardTypeId: uuid("reward_type_id").references(() => rewardTypes.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull().default("reward"),
    points: integer("points").notNull().default(0),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("activity_logs_created_idx").on(t.createdAt),
    index("activity_logs_student_idx").on(t.studentId),
  ],
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Student = typeof students.$inferSelect;
export type RewardType = typeof rewardTypes.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
