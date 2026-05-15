import { Router } from "express";
import { db } from "@workspace/db";
import { voiceTranscriptsTable } from "@workspace/db";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { SaveVoiceTranscriptBody } from "@workspace/api-zod";
import { calculateRiskScore, getRiskLevel, getRecommendations, generateAIResponse, detectIntent } from "../lib/triage.js";
import crypto from "crypto";

const router = Router();

router.post("/transcript", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = SaveVoiceTranscriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { transcript, language } = parsed.data;
  const userId = req.userId ?? null;
  const sessionId = (req.body.sessionId as string | null) ?? (userId ? null : crypto.randomUUID());

  const symptoms = transcript.split(/[,.\n]+/).map(s => s.trim()).filter(Boolean);
  const riskScore = calculateRiskScore(symptoms, 5, 30);
  const riskLevel = getRiskLevel(riskScore);
  const recommendations = getRecommendations(riskLevel, symptoms, language);
  const intent = detectIntent(transcript);
  const aiResponse = generateAIResponse(transcript, riskLevel, intent, language, recommendations);

  const [vt] = await db
    .insert(voiceTranscriptsTable)
    .values({
      userId,
      sessionId,
      transcript,
      language,
      aiResponse,
      intent,
    })
    .returning();

  res.status(201).json({
    id: vt.id,
    transcript: vt.transcript,
    language: vt.language,
    aiResponse: vt.aiResponse,
    intent: vt.intent,
    createdAt: vt.createdAt.toISOString(),
  });
});

export default router;
