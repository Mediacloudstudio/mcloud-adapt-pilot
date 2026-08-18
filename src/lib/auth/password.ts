// Password hashing helpers. Isolated in one file so the hashing algorithm
// can be swapped (e.g. to argon2) in one place later without touching
// every call site.

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
