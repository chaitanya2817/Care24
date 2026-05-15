import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ACCESS_SECRET = process.env["JWT_SECRET"] || "careai-access-secret-change-in-prod";
const REFRESH_SECRET = process.env["JWT_REFRESH_SECRET"] || "careai-refresh-secret-change-in-prod";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export function getRefreshExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}
