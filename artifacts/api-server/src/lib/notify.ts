import { db, notificationsTable } from "@workspace/db";
import { logger } from "./logger";

type NotifType = "achievement" | "reminder" | "alert" | "announcement" | "streak";

interface NotifPayload {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  level?: 1 | 2 | 3;
}

export async function createNotification(payload: NotifPayload) {
  try {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await db.insert(notificationsTable).values({
      id,
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      level: payload.level ?? 1,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to create notification");
  }
}
