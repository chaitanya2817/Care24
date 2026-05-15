import { Router } from "express";
import { db } from "@workspace/db";
import { doctorsTable, appointmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { ListDoctorsQueryParams, BookAppointmentBody } from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

router.get("/doctors", async (req, res) => {
  const parsed = ListDoctorsQueryParams.safeParse(req.query);
  const specialty = parsed.success ? parsed.data.specialty : undefined;
  const available = parsed.success ? parsed.data.available : undefined;

  let doctors = await db.select().from(doctorsTable);

  if (specialty) {
    doctors = doctors.filter(d => d.specialty.toLowerCase().includes(specialty.toLowerCase()));
  }
  if (available !== undefined) {
    doctors = doctors.filter(d => d.available === available);
  }

  res.json(
    doctors.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      experience: d.experience,
      rating: d.rating,
      reviewCount: d.reviewCount,
      available: d.available,
      avatarEmoji: d.avatarEmoji,
      nextSlot: d.nextSlot,
    }))
  );
});

router.post("/book", optionalAuth as any, async (req: AuthRequest, res) => {
  const parsed = BookAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { doctorId, type } = parsed.data;
  const userId = req.userId ?? null;
  const sessionId = (req.body.sessionId as string | null) ?? (userId ? null : crypto.randomUUID());
  const preferredTime = (req.body.preferredTime as string | null) ?? null;

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, doctorId)).limit(1);
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  const scheduledAt = preferredTime ? new Date(preferredTime) : new Date(Date.now() + 30 * 60 * 1000);

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      doctorId,
      userId,
      sessionId,
      type,
      status: "confirmed",
      scheduledAt,
    })
    .returning();

  res.status(201).json({
    id: appointment.id,
    doctorId: appointment.doctorId,
    type: appointment.type,
    status: appointment.status,
    doctor: {
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      experience: doctor.experience,
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
      available: doctor.available,
      avatarEmoji: doctor.avatarEmoji,
      nextSlot: doctor.nextSlot,
    },
    scheduledAt: appointment.scheduledAt?.toISOString() ?? null,
    createdAt: appointment.createdAt.toISOString(),
  });
});

export default router;
