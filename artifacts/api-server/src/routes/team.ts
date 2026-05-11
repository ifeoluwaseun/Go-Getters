import { Router } from "express";
import { db, usersTable, tasksTable, goalsTable, evidenceTable, teamMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, generateId, getAuth } from "../lib/auth";
import { createNotification } from "../lib/notify";

const router = Router();

function memberStatus(u: typeof usersTable.$inferSelect): "active" | "at-risk" | "inactive" {
  if (u.streak >= 5 && u.completionRate >= 70) return "active";
  if (u.streak >= 1 || u.completionRate >= 40) return "at-risk";
  return "inactive";
}

async function buildMember(m: typeof usersTable.$inferSelect, today: string) {
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, m.id));
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, m.id));
  const evidence = await db.select().from(evidenceTable).where(eq(evidenceTable.userId, m.id));
  const { passwordHash: _ph, ...safe } = m;
  return {
    ...safe, status: memberStatus(m), lastActive: "recently",
    tasks: tasks.filter(t => t.date === today),
    goals: goals.map(g => ({ ...g, taskIds: tasks.filter(t => t.goalId === g.id).map(t => t.id) })),
    evidence,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const { userId, userRole } = getAuth(req);
  if (userRole !== "admin" && userRole !== "leader") { res.status(403).json({ error: "Forbidden" }); return; }
  const today = new Date().toISOString().split("T")[0];
  const all = await db.select().from(usersTable).where(eq(usersTable.status, "approved"));
  const members = userRole === "admin"
    ? all.filter(u => u.id !== userId)
    : all.filter(u => u.leaderId === userId);
  const result = await Promise.all(members.map(m => buildMember(m, today)));
  res.json({ members: result });
});

router.get("/:id", requireAuth, async (req, res) => {
  const { userRole } = getAuth(req);
  if (userRole !== "admin" && userRole !== "leader") { res.status(403).json({ error: "Forbidden" }); return; }
  const id = String(req.params.id);
  const today = new Date().toISOString().split("T")[0];
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Member not found" }); return; }
  res.json({ member: await buildMember(rows[0], today) });
});

router.get("/:id/messages", requireAuth, async (req, res) => {
  const { userRole } = getAuth(req);
  if (userRole !== "admin" && userRole !== "leader") { res.status(403).json({ error: "Forbidden" }); return; }
  const id = String(req.params.id);
  const messages = await db.select().from(teamMessagesTable).where(eq(teamMessagesTable.memberId, id));
  messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  res.json({ messages });
});

router.post("/:id/messages", requireAuth, async (req, res) => {
  const { userId, userRole, user } = getAuth(req);
  if (userRole !== "admin" && userRole !== "leader") { res.status(403).json({ error: "Forbidden" }); return; }
  const memberId = String(req.params.id);
  const { content, type } = req.body as { content: string; type?: string };
  const msg = {
    id: generateId(), memberId,
    senderId: userId, senderName: user.name,
    content, type: type || "message",
    sentAt: new Date().toISOString(),
  };
  await db.insert(teamMessagesTable).values(msg);

  // Notify the member they received a message
  const isNote = type === "note";
  await createNotification({
    userId: memberId,
    type: isNote ? "announcement" : "reminder",
    title: isNote ? `📝 Note from ${user.name}` : `💬 Message from ${user.name}`,
    body: content.length > 120 ? content.slice(0, 117) + "…" : content,
    level: 1,
  });

  res.status(201).json({ message: msg });
});

export default router;
