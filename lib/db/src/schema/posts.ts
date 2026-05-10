import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull().default("member"),
  content: text("content").notNull(),
  type: text("type").notNull().default("win"),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postLikesTable = pgTable("post_likes", {
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ createdAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type DbPost = typeof postsTable.$inferSelect;
