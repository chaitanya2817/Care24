import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  patientName: text("patient_name"),
  symptoms: jsonb("symptoms").notNull().$type<string[]>(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  painLevel: integer("pain_level").notNull(),
  additionalNotes: text("additional_notes"),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  recommendations: jsonb("recommendations").notNull().$type<string[]>(),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({ id: true, createdAt: true });
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessmentsTable.$inferSelect;
