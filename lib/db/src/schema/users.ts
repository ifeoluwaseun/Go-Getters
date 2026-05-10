import { pgTable, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("pending"),
  streak: integer("streak").notNull().default(0),
  points: integer("points").notNull().default(0),
  completionRate: real("completion_rate").notNull().default(0),
  consistency: real("consistency").notNull().default(0),
  joinedAt: text("joined_at").notNull(),
  title: text("title"),
  leaderId: text("leader_id"),
  leaderName: text("leader_name"),
  sponsorId: text("sponsor_id"),
  sponsorName: text("sponsor_name"),
  rejectionReason: text("rejection_reason"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ updatedAt: true });
export const selectUserSchema = createSelectSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DbUser = typeof usersTable.$inferSelect;
