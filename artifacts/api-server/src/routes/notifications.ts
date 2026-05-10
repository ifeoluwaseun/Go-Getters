import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId));
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ notifications });
});

router.post("/:id/read", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const id = String(req.params.id);
  await db.update(notificationsTable).set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
  res.json({ ok: true });
});

router.post("/read-all", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, userId));
  res.json({ ok: true });
});

export default router;
