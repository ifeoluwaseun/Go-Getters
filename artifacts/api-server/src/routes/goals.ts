import { Router } from "express";
import { db, goalsTable, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, generateId, getAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
  res.json({ goals: goals.map(g => ({ ...g, taskIds: tasks.filter(t => t.goalId === g.id).map(t => t.id) })) });
});

router.get("/user/:userId", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const targetId = String(req.params.userId);
  if (auth.userRole !== "admin" && auth.userRole !== "leader" && auth.userId !== targetId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, targetId));
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, targetId));
  res.json({ goals: goals.map(g => ({ ...g, taskIds: tasks.filter(t => t.goalId === g.id).map(t => t.id) })) });
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const b = req.body as Record<string, unknown>;
  const goal = {
    id: generateId(), userId,
    title: b.title as string,
    description: (b.description as string) || "",
    weekStart: b.weekStart as string,
    category: b.category as string,
    progress: (b.progress as number) ?? 0,
    color: (b.color as string) || "#00d8fe",
  };
  await db.insert(goalsTable).values(goal);
  res.status(201).json({ goal: { ...goal, taskIds: [] } });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const id = String(req.params.id);
  const rows = await db.select().from(goalsTable).where(eq(goalsTable.id, id)).limit(1);
  if (!rows[0] || rows[0].userId !== userId) { res.status(404).json({ error: "Goal not found" }); return; }
  const b = req.body as Record<string, unknown>;
  const updates: Partial<typeof goalsTable.$inferInsert> = {};
  if (b.title !== undefined) updates.title = b.title as string;
  if (b.description !== undefined) updates.description = b.description as string;
  if (b.progress !== undefined) updates.progress = b.progress as number;
  if (b.color !== undefined) updates.color = b.color as string;
  if (b.category !== undefined) updates.category = b.category as string;
  const updated = await db.update(goalsTable).set(updates).where(eq(goalsTable.id, id)).returning();
  res.json({ goal: { ...updated[0], taskIds: [] } });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const id = String(req.params.id);
  await db.delete(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
  res.json({ ok: true });
});

export default router;
