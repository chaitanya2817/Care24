import { Router } from "express";
import { db } from "@workspace/db";
import { assessmentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { SubmitAssessmentBody, GetAssessmentHistoryQueryParams, GetAssessmentParams } from "@workspace/api-zod";
import { calculateRiskScore, getRiskLevel, getRecommendations } from "../lib/triage.js";
import crypto from "crypto";

const router = Router();

router.post("/submit", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = SubmitAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { symptoms, age, gender, painLevel, additionalNotes, language, patientName } = parsed.data;
  const userId = req.userId ?? null;
  const sessionId = (req.body.sessionId as string | null) ?? (userId ? null : crypto.randomUUID());

  const riskScore = calculateRiskScore(symptoms, painLevel, age);
  const riskLevel = getRiskLevel(riskScore);
  const recommendations = getRecommendations(riskLevel, symptoms, language ?? "en");

  const [assessment] = await db
    .insert(assessmentsTable)
    .values({
      userId,
      sessionId,
      patientName: patientName ?? null,
      symptoms,
      age,
      gender,
      painLevel,
      additionalNotes: additionalNotes ?? null,
      riskScore,
      riskLevel,
      recommendations,
      language: language ?? "en",
    })
    .returning();

  res.status(201).json({
    id: assessment.id,
    symptoms: assessment.symptoms,
    age: assessment.age,
    gender: assessment.gender,
    painLevel: assessment.painLevel,
    riskScore: assessment.riskScore,
    riskLevel: assessment.riskLevel,
    recommendations: assessment.recommendations,
    additionalNotes: assessment.additionalNotes,
    patientName: assessment.patientName,
    language: assessment.language,
    createdAt: assessment.createdAt.toISOString(),
  });
});

router.get("/history", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = GetAssessmentHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const userId = req.userId ?? null;
  const sessionId = req.query["sessionId"] as string | undefined;

  let items;
  if (userId) {
    items = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.userId, userId))
      .orderBy(desc(assessmentsTable.createdAt))
      .limit(limit);
  } else if (sessionId) {
    items = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.sessionId, sessionId))
      .orderBy(desc(assessmentsTable.createdAt))
      .limit(limit);
  } else {
    items = [];
  }

  res.json(
    items.map(a => ({
      id: a.id,
      symptoms: a.symptoms,
      age: a.age,
      gender: a.gender,
      painLevel: a.painLevel,
      riskScore: a.riskScore,
      riskLevel: a.riskLevel,
      recommendations: a.recommendations,
      additionalNotes: a.additionalNotes,
      patientName: a.patientName,
      language: a.language,
      createdAt: a.createdAt.toISOString(),
    }))
  );
});

router.get("/:id", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = GetAssessmentParams.safeParse({ id: parseInt(req.params["id"] ?? "0") });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [a] = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.id, parsed.data.id))
    .limit(1);

  if (!a) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  res.json({
    id: a.id,
    symptoms: a.symptoms,
    age: a.age,
    gender: a.gender,
    painLevel: a.painLevel,
    riskScore: a.riskScore,
    riskLevel: a.riskLevel,
    recommendations: a.recommendations,
    additionalNotes: a.additionalNotes,
    patientName: a.patientName,
    language: a.language,
    createdAt: a.createdAt.toISOString(),
  });
});

export default router;
