import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.status, "approved"));

  const sorted = users
    .sort((a, b) => b.points - a.points)
    .map((u, i) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      points: u.points,
      streak: u.streak,
      completionRate: u.completionRate,
      rank: i + 1,
      change: "same" as const,
    }));

  res.json({ leaderboard: sorted });
});

export default router;
