import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";

export type VerifyEmailResult =
  | { status: "success"; email: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "already-used" };

export async function verifyEmailToken(rawToken: string): Promise<VerifyEmailResult> {
  const tokenHash = hashToken(rawToken);

  const token = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!token) {
    return { status: "invalid" };
  }
  if (token.usedAt) {
    return { status: "already-used" };
  }
  if (token.expiresAt < new Date()) {
    return { status: "expired" };
  }

  await db.$transaction([
    db.user.update({
      where: { id: token.userId },
      data: { emailVerified: new Date(), status: "ACTIVE" },
    }),
    db.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { status: "success", email: token.user.email };
}
