import { Router } from "express";
import { db, postsTable, postLikesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, generateId, getAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const posts = await db.select().from(postsTable);
  const likes = await db.select().from(postLikesTable).where(eq(postLikesTable.userId, userId));
  const likedSet = new Set(likes.map(l => l.postId));
  const result = posts
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .map(p => ({ ...p, liked: likedSet.has(p.id) }));
  res.json({ posts: result });
});

router.post("/", requireAuth, async (req, res) => {
  const { userId, user } = getAuth(req);
  const { content, type } = req.body as { content: string; type?: string };
  const post = {
    id: generateId(), userId,
    userName: user.name, userRole: user.role,
    content, type: type || "win", likes: 0, comments: 0,
  };
  await db.insert(postsTable).values(post);
  res.status(201).json({ post: { ...post, liked: false, createdAt: new Date().toISOString() } });
});

router.post("/:id/like", requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  const postId = String(req.params.id);
  const existing = await db.select().from(postLikesTable)
    .where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, userId)))
    .limit(1);
  const postRows = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
  const currentLikes = postRows[0]?.likes ?? 0;
  if (existing[0]) {
    await db.delete(postLikesTable).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, userId)));
    const newLikes = Math.max(0, currentLikes - 1);
    await db.update(postsTable).set({ likes: newLikes }).where(eq(postsTable.id, postId));
    res.json({ liked: false, likes: newLikes });
  } else {
    await db.insert(postLikesTable).values({ postId, userId });
    const newLikes = currentLikes + 1;
    await db.update(postsTable).set({ likes: newLikes }).where(eq(postsTable.id, postId));
    res.json({ liked: true, likes: newLikes });
  }
});

export default router;
