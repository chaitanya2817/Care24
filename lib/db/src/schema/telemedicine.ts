import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  experience: integer("experience").notNull(),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("review_count").notNull().default(0),
  available: boolean("available").notNull().default(true),
  avatarEmoji: text("avatar_emoji").notNull().default("👨‍⚕️"),
  nextSlot: text("next_slot"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctorsTable.id),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true, createdAt: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;
export type Appointment = typeof appointmentsTable.$inferSelect;
