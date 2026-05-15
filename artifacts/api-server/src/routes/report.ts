import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, assessmentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { GenerateReportBody, ListReportsQueryParams } from "@workspace/api-zod";

const router = Router();

function buildSummary(a: typeof assessmentsTable.$inferSelect): string {
  const symptomList = Array.isArray(a.symptoms) ? a.symptoms.join(", ") : "";
  return `Patient ${a.patientName ?? "Unknown"} (${a.age}y, ${a.gender}) presented with ${symptomList}. Pain level: ${a.painLevel}/10. AI Risk Score: ${a.riskScore}/100. Risk Level: ${a.riskLevel.toUpperCase()}. Assessment performed on ${a.createdAt.toLocaleDateString("en-IN")}.`;
}

router.post("/generate", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = GenerateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { assessmentId } = parsed.data;
  const userId = req.userId ?? null;
  const sessionId = (req.body.sessionId as string | null) ?? null;

  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.id, assessmentId))
    .limit(1);

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const summary = buildSummary(assessment);
  const diagnosis = `Based on the reported symptoms and risk analysis, the patient may be experiencing conditions related to: ${Array.isArray(assessment.symptoms) ? assessment.symptoms.slice(0, 3).join(", ") : "various symptoms"}. This AI assessment is not a medical diagnosis.`;
  const recommendations = Array.isArray(assessment.recommendations) ? assessment.recommendations : [];

  const [report] = await db
    .insert(reportsTable)
    .values({
      assessmentId,
      userId,
      sessionId,
      summary,
      diagnosis,
      recommendations,
    })
    .returning();

  res.status(201).json({
    id: report.id,
    assessmentId: report.assessmentId,
    summary: report.summary,
    diagnosis: report.diagnosis,
    recommendations: report.recommendations,
    assessment: {
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
    },
    createdAt: report.createdAt.toISOString(),
  });
});

router.get("/list", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = ListReportsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
  const userId = req.userId ?? null;
  const sessionId = req.query["sessionId"] as string | undefined;

  let reports;
  if (userId) {
    reports = await db
      .select()
      .from(reportsTable)
      .where(eq(reportsTable.userId, userId))
      .orderBy(desc(reportsTable.createdAt))
      .limit(limit);
  } else if (sessionId) {
    reports = await db
      .select()
      .from(reportsTable)
      .where(eq(reportsTable.sessionId, sessionId))
      .orderBy(desc(reportsTable.createdAt))
      .limit(limit);
  } else {
    reports = [];
  }

  res.json(
    reports.map(r => ({
      id: r.id,
      assessmentId: r.assessmentId,
      summary: r.summary,
      diagnosis: r.diagnosis,
      recommendations: r.recommendations,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

export default router;
