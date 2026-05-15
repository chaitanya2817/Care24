import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const voiceTranscriptsTable = pgTable("voice_transcripts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  transcript: text("transcript").notNull(),
  language: text("language").notNull().default("en"),
  aiResponse: text("ai_response").notNull().default(""),
  intent: text("intent").notNull().default("general"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVoiceTranscriptSchema = createInsertSchema(voiceTranscriptsTable).omit({ id: true, createdAt: true });
export type InsertVoiceTranscript = z.infer<typeof insertVoiceTranscriptSchema>;
export type VoiceTranscript = typeof voiceTranscriptsTable.$inferSelect;
