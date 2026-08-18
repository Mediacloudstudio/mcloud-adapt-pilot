// Helpers for one-time tokens (email verification, password reset).
// We never store the raw token — only its SHA-256 hash — so a database
// leak alone can't be used to verify emails or reset passwords.

import { randomBytes, createHash } from "crypto";

export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
