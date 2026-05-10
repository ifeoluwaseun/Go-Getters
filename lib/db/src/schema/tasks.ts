import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  goalId: text("goal_id"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  dueTime: text("due_time"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  hasEvidence: boolean("has_evidence").notNull().default(false),
  recurring: boolean("recurring").notNull().default(false),
  notes: text("notes"),
  date: text("date").notNull(),
  completedAt: text("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type DbTask = typeof tasksTable.$inferSelect;
