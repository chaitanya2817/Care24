import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { UpdateUserPreferencesBody } from "@workspace/api-zod";

const router = Router();

router.get("/profile", authMiddleware as any, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    language: user.language,
    voiceEnabled: user.voiceEnabled,
    voiceRate: user.voiceRate,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/preferences", authMiddleware as any, async (req: AuthRequest, res) => {
  const parsed = UpdateUserPreferencesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.language !== undefined) updates.language = parsed.data.language;
  if (parsed.data.voiceEnabled !== undefined) updates.voiceEnabled = parsed.data.voiceEnabled;
  if (parsed.data.voiceRate !== undefined) updates.voiceRate = parsed.data.voiceRate;
  updates.updatedAt = new Date();

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    language: user.language,
    voiceEnabled: user.voiceEnabled,
    voiceRate: user.voiceRate,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
