import { type Request, type Response, type NextFunction } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

export interface AuthRequest extends Request {
  _authUserId?: string;
  _authUserRole?: string;
  _authUser?: typeof usersTable.$inferSelect;
}

export interface AuthData {
  userId: string;
  userRole: string;
  user: typeof usersTable.$inferSelect;
}

export function getAuth(req: Request): AuthData {
  const r = req as AuthRequest;
  return {
    userId: String(r._authUserId),
    userRole: String(r._authUserRole),
    user: r._authUser!,
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .limit(1);

  const session = sessions[0];
  if (!session || new Date(session.expiresAt) < new Date()) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  authReq._authUserId = user.id;
  authReq._authUserRole = user.role;
  authReq._authUser = user;
  next();
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gg_salt_2024").digest("hex");
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
