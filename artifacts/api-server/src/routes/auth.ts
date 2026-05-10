import { Router } from "express";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateId, generateToken, requireAuth, getAuth } from "../lib/auth";

const router = Router();
const ADMIN_CODE = "GOGETTERS2024";

function sessionExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

function safeUser(u: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }

  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
  const user = rows[0];
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken();
  await db.insert(sessionsTable).values({ id: generateId(), userId: user.id, token, expiresAt: sessionExpiry() });
  res.json({ token, user: safeUser(user) });
});

router.post("/register", async (req, res) => {
  const { name, email, password, role, leaderId, leaderName, sponsorId, sponsorName, adminCode } = req.body as Record<string, string>;
  if (!name || !email || !password) { res.status(400).json({ error: "Name, email and password required" }); return; }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
  if (existing[0]) { res.status(409).json({ error: "Email already registered" }); return; }

  const isAdmin = adminCode?.trim() === ADMIN_CODE;
  const finalRole = isAdmin ? "admin" : (role || "member");
  const userId = generateId();
  const user = {
    id: userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    role: finalRole,
    status: isAdmin ? "approved" : "pending",
    streak: 0, points: 0, completionRate: 0, consistency: 0,
    joinedAt: new Date().toISOString(),
    title: finalRole === "admin" ? "Organization Owner" : finalRole === "leader" ? "Team Leader" : "Go-Getter",
    leaderId: leaderId || null, leaderName: leaderName || null,
    sponsorId: sponsorId || null, sponsorName: sponsorName || null,
    rejectionReason: null,
  };

  await db.insert(usersTable).values(user);
  const token = generateToken();
  await db.insert(sessionsTable).values({ id: generateId(), userId, token, expiresAt: sessionExpiry() });
  res.status(201).json({ token, user: safeUser(user as typeof usersTable.$inferSelect) });
});

router.post("/logout", requireAuth, async (req, res) => {
  const token = req.headers["authorization"]!.slice(7);
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const { user } = getAuth(req);
  res.json({ user: safeUser(user) });
});

export default router;
