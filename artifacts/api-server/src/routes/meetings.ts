import { Router } from "express";
import { db, meetingsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const meetings = await db.select().from(meetingsTable);
  meetings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  res.json({ meetings });
});

export default router;
