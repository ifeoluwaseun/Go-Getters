import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const meetingsTable = pgTable("meetings", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  link: text("link").notNull().default(""),
  type: text("type").notNull().default("accountability"),
  host: text("host").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DbMeeting = typeof meetingsTable.$inferSelect;
