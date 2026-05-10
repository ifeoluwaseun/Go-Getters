import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalsTable = pgTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  weekStart: text("week_start").notNull(),
  category: text("category").notNull(),
  progress: real("progress").notNull().default(0),
  color: text("color").notNull().default("#00d8fe"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ createdAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type DbGoal = typeof goalsTable.$inferSelect;
