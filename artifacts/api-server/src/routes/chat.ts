import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { calculateRiskScore, getRiskLevel, getRecommendations, generateAIResponse, detectEmergency, detectIntent } from "../lib/triage.js";
import crypto from "crypto";

const router = Router();

router.post("/message", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { message, language, sessionId: incomingSessionId } = parsed.data;
  const userId = req.userId ?? null;
  const sessionId = incomingSessionId ?? (userId ? null : crypto.randomUUID());

  await db.insert(chatMessagesTable).values({
    userId,
    sessionId,
    role: "user",
    content: message,
    language,
  });

  const symptoms = message.split(/[,.\n]+/).map(s => s.trim()).filter(Boolean);
  const riskScore = calculateRiskScore(symptoms, 5, 30);
  const riskLevel = getRiskLevel(riskScore);
  const recommendations = getRecommendations(riskLevel, symptoms, language);
  const intent = detectIntent(message);
  const emergency = detectEmergency(symptoms);
  const aiMessage = generateAIResponse(message, riskLevel, intent, language, recommendations);

  await db.insert(chatMessagesTable).values({
    userId,
    sessionId,
    role: "assistant",
    content: aiMessage,
    language,
  });

  res.json({
    message: aiMessage,
    riskScore,
    riskLevel,
    intent,
    sessionId: sessionId ?? crypto.randomUUID(),
    emergencyDetected: emergency,
    recommendations,
  });
});

router.get("/history", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = GetChatHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const sessionId = req.query["sessionId"] as string | undefined;
  const userId = req.userId ?? null;

  let msgs;
  if (userId) {
    msgs = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, userId))
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(limit);
  } else if (sessionId) {
    msgs = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(limit);
  } else {
    msgs = [];
  }

  res.json(
    msgs.reverse().map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      language: m.language,
      sessionId: m.sessionId,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

export default router;
