import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";

export const achievementsTable = pgTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earnedAt: text("earned_at").notNull(),
  color: text("color").notNull().default("#00d8fe"),
});

export const weeklyAchieversTable = pgTable("weekly_achievers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull().default("member"),
  title: text("title").notNull(),
  badge: text("badge").notNull(),
  completionRate: real("completion_rate").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  points: integer("points").notNull().default(0),
  weekStart: text("week_start").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DbAchievement = typeof achievementsTable.$inferSelect;
export type DbWeeklyAchiever = typeof weeklyAchieversTable.$inferSelect;
