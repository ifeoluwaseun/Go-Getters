import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull().default("announcement"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  level: integer("level").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export type DbNotification = typeof notificationsTable.$inferSelect;
