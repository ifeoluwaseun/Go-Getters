import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const teamMessagesTable = pgTable("team_messages", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("message"),
  sentAt: text("sent_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DbTeamMessage = typeof teamMessagesTable.$inferSelect;
