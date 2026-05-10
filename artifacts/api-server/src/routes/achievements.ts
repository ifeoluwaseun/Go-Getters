import { Router } from "express";
import { db, achievementsTable, weeklyAchieversTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const achievements = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));
  res.json({ achievements });
});

router.get("/achievers", requireAuth, async (_req, res) => {
  const achievers = await db.select().from(weeklyAchieversTable);
  res.json({ achievers });
});

export default router;
