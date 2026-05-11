import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getAuth } from "../lib/auth";
import { createNotification } from "../lib/notify";
import { email } from "../lib/email";

const router = Router();

function safeUser(u: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

router.get("/", requireAuth, async (_req, res) => {
  const users = await db.select().from(usersTable);
  res.json({ users: users.map(safeUser) });
});

router.get("/leaders", requireAuth, async (_req, res) => {
  const all = await db.select().from(usersTable);
  const leaders = all
    .filter(u => u.role === "leader" || u.role === "admin")
    .map(u => ({ id: u.id, name: u.name }));
  res.json({ leaders });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { userId, userRole } = getAuth(req);
  const id = String(req.params.id);
  if (userId !== id && userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const b = req.body as Record<string, unknown>;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (b.name !== undefined) updates.name = b.name as string;
  if (b.title !== undefined) updates.title = b.title as string;
  if (b.streak !== undefined) updates.streak = b.streak as number;
  if (b.points !== undefined) updates.points = b.points as number;
  if (b.completionRate !== undefined) updates.completionRate = b.completionRate as number;
  if (b.consistency !== undefined) updates.consistency = b.consistency as number;
  const updated = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  res.json({ user: safeUser(updated[0]) });
});

router.post("/:id/approve", requireAuth, async (req, res) => {
  const { userRole } = getAuth(req);
  const id = String(req.params.id);
  if (userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const updated = await db.update(usersTable).set({ status: "approved" }).where(eq(usersTable.id, id)).returning();
  const user = updated[0];
  if (user) {
    await Promise.all([
      createNotification({
        userId: id,
        type: "announcement",
        title: "🎉 Welcome to Go-Getters!",
        body: `Your application has been approved, ${user.name}! Start by setting your goals and completing your first task today.`,
        level: 1,
      }),
      email.welcomeApproved(user.email, user.name),
    ]);
  }
  res.json({ user: safeUser(user) });
});

router.post("/:id/reject", requireAuth, async (req, res) => {
  const { userRole } = getAuth(req);
  const id = String(req.params.id);
  if (userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const { reason } = req.body as { reason?: string };
  const updated = await db.update(usersTable)
    .set({ status: "rejected", rejectionReason: reason || "No reason given" })
    .where(eq(usersTable.id, id)).returning();
  res.json({ user: safeUser(updated[0]) });
});

export default router;
