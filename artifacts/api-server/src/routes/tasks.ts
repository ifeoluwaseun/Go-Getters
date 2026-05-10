import { Router } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, generateId, getAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const { date } = req.query as { date?: string };
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
  res.json({ tasks: date ? tasks.filter(t => t.date === date) : tasks });
});

router.get("/user/:userId", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const targetId = String(req.params.userId);
  if (auth.userRole !== "admin" && auth.userRole !== "leader" && auth.userId !== targetId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { date } = req.query as { date?: string };
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, targetId));
  res.json({ tasks: date ? tasks.filter(t => t.date === date) : tasks });
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const b = req.body as Record<string, unknown>;
  const task = {
    id: generateId(), userId,
    goalId: (b.goalId as string) || null,
    title: b.title as string,
    description: (b.description as string) || null,
    category: b.category as string,
    dueTime: (b.dueTime as string) || null,
    priority: (b.priority as string) || "medium",
    status: (b.status as string) || "pending",
    hasEvidence: (b.hasEvidence as boolean) ?? false,
    recurring: (b.recurring as boolean) ?? false,
    notes: (b.notes as string) || null,
    date: b.date as string,
    completedAt: null,
  };
  await db.insert(tasksTable).values(task);
  res.status(201).json({ task });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const id = String(req.params.id);
  const rows = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
  if (!rows[0] || rows[0].userId !== userId) { res.status(404).json({ error: "Task not found" }); return; }
  const b = req.body as Record<string, unknown>;
  const updates: Partial<typeof tasksTable.$inferInsert> = {};
  if (b.status !== undefined) updates.status = b.status as string;
  if (b.completedAt !== undefined) updates.completedAt = b.completedAt as string;
  if (b.hasEvidence !== undefined) updates.hasEvidence = b.hasEvidence as boolean;
  if (b.title !== undefined) updates.title = b.title as string;
  if (b.category !== undefined) updates.category = b.category as string;
  if (b.priority !== undefined) updates.priority = b.priority as string;
  if (b.dueTime !== undefined) updates.dueTime = b.dueTime as string;
  if (b.notes !== undefined) updates.notes = b.notes as string;
  const updated = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();
  res.json({ task: updated[0] });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const id = String(req.params.id);
  await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));
  res.json({ ok: true });
});

export default router;
