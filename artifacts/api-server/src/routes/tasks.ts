import { Router } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, generateId, getAuth } from "../lib/auth";
import { createNotification } from "../lib/notify";
import { email } from "../lib/email";

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

  // Fire notifications + emails when a task is marked completed
  if (b.status === "completed" && rows[0].status !== "completed") {
    const task = rows[0];
    const userRows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const user = userRows[0];

    if (user) {
      const newStreak = user.streak + 1;
      await db.update(usersTable)
        .set({ streak: newStreak, points: user.points + 10 })
        .where(eq(usersTable.id, userId));

      // Count completed tasks today
      const today = new Date().toISOString().split("T")[0];
      const todayTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
      const completedToday = todayTasks.filter(
        t => t.date === today && (t.id === id || t.status === "completed")
      ).length;

      // Streak milestone — notify + email
      if (newStreak === 3 || newStreak % 7 === 0) {
        await Promise.all([
          createNotification({
            userId,
            type: "streak",
            title: `🔥 ${newStreak}-Day Streak!`,
            body: newStreak === 3
              ? "You're on a roll! Three days of consistent action. Don't stop now."
              : `Incredible! ${newStreak} days of showing up. You're unstoppable.`,
            level: 1,
          }),
          email.streakMilestone(user.email, user.name, newStreak),
        ]);
      }

      // First task of the day
      if (completedToday === 1) {
        await Promise.all([
          createNotification({
            userId,
            type: "reminder",
            title: "✅ First Task Done!",
            body: `"${task.title}" is complete. Momentum is everything — keep going!`,
            level: 1,
          }),
          email.taskCompleted(user.email, user.name, task.title, newStreak),
        ]);
      }

      // 5-task milestone
      if (completedToday === 5) {
        await createNotification({
          userId,
          type: "achievement",
          title: "⚡ 5 Tasks Crushed Today!",
          body: `You just completed "${task.title}" and hit 5 tasks for the day. You're unstoppable!`,
          level: 1,
        });
      }
    }
  }

  res.json({ task: updated[0] });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const id = String(req.params.id);
  await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));
  res.json({ ok: true });
});

export default router;
