import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshExpiry,
} from "../lib/auth.js";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { RegisterBody, LoginBody, RefreshTokenBody } from "@workspace/api-zod";

const router = Router();

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password, name } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({ email, name, passwordHash }).returning();

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: getRefreshExpiry(),
  });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !comparePassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: getRefreshExpiry(),
  });

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/logout", authMiddleware as any, async (req: AuthRequest, res) => {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, token)).catch(() => {});
  }
  res.json({ message: "Logged out successfully" });
});

router.post("/refresh", async (req, res) => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { refreshToken } = parsed.data;
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const [stored] = await db
    .select()
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.token, refreshToken))
    .limit(1);

  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: "Refresh token expired or not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, refreshToken));

  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    token: newRefreshToken,
    expiresAt: getRefreshExpiry(),
  });

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() },
  });
});

router.get("/me", authMiddleware as any, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() });
});

export default router;
