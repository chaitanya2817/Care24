import { Router } from "express";
import { db } from "@workspace/db";
import { assessmentsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/summary", optionalAuth as any, async (req: AuthRequest, res) => {
  const userId = req.userId ?? null;
  const sessionId = req.query["sessionId"] as string | undefined;

  let allAssessments: typeof assessmentsTable.$inferSelect[] = [];

  if (userId) {
    allAssessments = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.userId, userId))
      .orderBy(desc(assessmentsTable.createdAt))
      .limit(100);
  } else if (sessionId) {
    allAssessments = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.sessionId, sessionId))
      .orderBy(desc(assessmentsTable.createdAt))
      .limit(100);
  }

  const totalAssessments = allAssessments.length;
  const avgRiskScore =
    totalAssessments > 0
      ? Math.round(allAssessments.reduce((sum, a) => sum + a.riskScore, 0) / totalAssessments)
      : 0;

  const riskDistribution = { low: 0, moderate: 0, high: 0, emergency: 0 };
  for (const a of allAssessments) {
    const lvl = a.riskLevel as keyof typeof riskDistribution;
    if (lvl in riskDistribution) riskDistribution[lvl]++;
  }

  const recentAssessments = allAssessments.slice(0, 5).map(a => ({
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
  }));

  const symptomTrend: { date: string; count: number }[] = [];
  const last7Days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days[d.toLocaleDateString("en-CA")] = 0;
  }
  for (const a of allAssessments) {
    const dateKey = a.createdAt.toLocaleDateString("en-CA");
    if (dateKey in last7Days) {
      last7Days[dateKey]++;
    }
  }
  for (const [date, count] of Object.entries(last7Days)) {
    symptomTrend.push({ date, count });
  }

  res.json({
    totalAssessments,
    avgRiskScore,
    riskDistribution,
    recentAssessments,
    symptomTrend,
  });
});

export default router;
