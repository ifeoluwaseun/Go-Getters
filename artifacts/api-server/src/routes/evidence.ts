import { Router } from "express";
import { db, evidenceTable, tasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, generateId, getAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId, userRole } = getAuth(req);
  let evidence;
  if (userRole === "admin" || userRole === "leader") {
    evidence = await db.select().from(evidenceTable);
  } else {
    evidence = await db.select().from(evidenceTable).where(eq(evidenceTable.userId, userId));
  }
  evidence.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json({ evidence });
});

router.post("/", requireAuth, async (req, res) => {
  const { userId, user } = getAuth(req);
  const { taskId, taskTitle, type, description, uri, link } = req.body as Record<string, string>;
  const taskIdStr = String(taskId);
  const ev = {
    id: generateId(), taskId: taskIdStr, taskTitle,
    userId, userName: user.name,
    type: type || "screenshot",
    uri: uri || null, link: link || null,
    description, status: "pending", feedback: null,
    uploadedAt: new Date().toISOString(),
  };
  await db.insert(evidenceTable).values(ev);
  await db.update(tasksTable).set({ hasEvidence: true }).where(eq(tasksTable.id, taskIdStr));
  res.status(201).json({ evidence: ev });
});

router.post("/:id/approve", requireAuth, async (req, res) => {
  const { userRole } = getAuth(req);
  const id = String(req.params.id);
  if (userRole !== "admin" && userRole !== "leader") { res.status(403).json({ error: "Forbidden" }); return; }
  const updated = await db.update(evidenceTable).set({ status: "approved" }).where(eq(evidenceTable.id, id)).returning();
  res.json({ evidence: updated[0] });
});

router.post("/:id/reject", requireAuth, async (req, res) => {
  const { userRole } = getAuth(req);
  const id = String(req.params.id);
  if (userRole !== "admin" && userRole !== "leader") { res.status(403).json({ error: "Forbidden" }); return; }
  const { feedback } = req.body as { feedback?: string };
  const updated = await db.update(evidenceTable)
    .set({ status: "rejected", feedback: feedback || "No feedback given" })
    .where(eq(evidenceTable.id, id)).returning();
  res.json({ evidence: updated[0] });
});

export default router;
