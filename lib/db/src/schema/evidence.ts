import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const evidenceTable = pgTable("evidence", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  taskTitle: text("task_title").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  type: text("type").notNull().default("screenshot"),
  uri: text("uri"),
  link: text("link"),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  feedback: text("feedback"),
  uploadedAt: text("uploaded_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEvidenceSchema = createInsertSchema(evidenceTable).omit({ createdAt: true });
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type DbEvidence = typeof evidenceTable.$inferSelect;
